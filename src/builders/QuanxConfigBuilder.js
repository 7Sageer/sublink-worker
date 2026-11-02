import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { groupProxiesByCountry } from '../utils.js';
import { QUANX_CONFIG, SURGE_SITE_RULE_SET_BASEURL, SURGE_IP_RULE_SET_BASEURL, generateRules, DIRECT_DEFAULT_RULES } from '../config/index.js';
import { addProxyWithDedup } from './helpers/proxyHelpers.js';
import { buildSelectorMembers, buildNodeSelectMembers, buildCustomRuleMembers, uniqueNames } from './helpers/groupBuilder.js';
import { parsePluginString } from '../parsers/protocols/shadowsocksParser.js';
import { InvalidPayloadError } from '../services/errors.js';

// Syntax reference: https://github.com/crossutility/Quantumult-X/blob/master/sample.conf

const SS_METHODS = new Set([
    'none', 'rc4-md5', 'rc4-md5-6', 'aes-128-cfb', 'aes-192-cfb', 'aes-256-cfb',
    'aes-128-ctr', 'aes-192-ctr', 'aes-256-ctr', 'bf-cfb', 'cast5-cfb', 'des-cfb', 'rc2-cfb',
    'salsa20', 'chacha20', 'chacha20-ietf', 'aes-128-gcm', 'aes-192-gcm', 'aes-256-gcm',
    'chacha20-ietf-poly1305', 'xchacha20-ietf-poly1305',
    '2022-blake3-aes-128-gcm', '2022-blake3-aes-256-gcm'
]);

const VMESS_METHODS = new Set(['none', 'aes-128-gcm', 'chacha20-poly1305']);

const BUILTIN_POLICIES = { DIRECT: 'direct', REJECT: 'reject' };

// Only the params subconverter has long emitted for QX, to stay compatible with older QX builds
const LATENCY_PARAMS = 'check-interval=600';

const REMOTE_UPDATE_INTERVAL = 86400;

// Built from the subscription and selected rules; a base config cannot override them,
// mirroring how Clash base configs never override proxies/rules.
const GENERATED_SECTIONS = new Set(['policy', 'server_local', 'filter_remote', 'filter_local']);

const SECTION_ORDER = [
    'general', 'dns', 'policy', 'server_remote', 'filter_remote', 'rewrite_remote',
    'server_local', 'filter_local', 'rewrite_local', 'task_local', 'http_backend', 'mitm'
];

function generalKey(line) {
    const index = line.indexOf('=');
    return index === -1 ? line : line.slice(0, index).trim();
}

// [general] merges per key so a user profile keeps defaults it omits (notably
// resource_parser_url, which the generated filter_remote lines depend on).
// Other sections are taken from the user config wholesale when present.
export function mergeQuanxSections(defaults = {}, user = {}) {
    // Null prototype: stored section names are user data and may be "__proto__"
    const merged = Object.assign(Object.create(null), defaults);
    Object.entries(user || {}).forEach(([name, lines]) => {
        if (GENERATED_SECTIONS.has(name)) return;
        if (name === 'general') {
            const userKeys = new Set(lines.map(generalKey));
            merged.general = [...(defaults.general || []).filter(line => !userKeys.has(generalKey(line))), ...lines];
        } else {
            merged[name] = [...lines];
        }
    });
    return merged;
}

// QX splits lines on commas and key=value pairs on '=' with no escaping, so names must avoid both
export function sanitizeQuanxName(name) {
    return String(name ?? '').replace(/[\r\n]+/g, ' ').replace(/,/g, '，').replace(/=/g, '＝').trim();
}

class UnsupportedProxyError extends Error { }

function unsupported(reason) {
    throw new UnsupportedProxyError(reason);
}

// A raw comma would silently shift every following parameter, so refuse instead
function param(key, value) {
    const str = String(value);
    if (/[,\r\n]/.test(str)) {
        unsupported(`${key} contains a comma or newline`);
    }
    return `${key}=${str}`;
}

function formatServer(server, port) {
    if (!server || !port) unsupported('missing server or port');
    // Subscription data is untrusted: a delimiter here would split or inject config lines
    if (/[,\s]/.test(String(server))) unsupported('server contains a delimiter');
    if (!/^\d+$/.test(String(port))) unsupported('invalid port');
    const host = String(server).includes(':') && !String(server).startsWith('[') ? `[${server}]` : server;
    return `${host}:${port}`;
}

function firstValue(value) {
    return Array.isArray(value) ? value[0] : value;
}

function getHostHeader(transport) {
    const headers = transport?.headers;
    if (!headers || typeof headers !== 'object') return undefined;
    return firstValue(headers.host ?? headers.Host);
}

// Sing-Box keeps SIP003 plugin_opts as a "k=v;flag" string, other sources give an object
function normalizePluginOpts(opts) {
    if (typeof opts === 'string') return parsePluginString(`plugin;${opts}`)?.plugin_opts || {};
    return opts && typeof opts === 'object' ? opts : {};
}

function getPath(transport) {
    return firstValue(transport?.path);
}

function isTlsEnabled(proxy) {
    return !!proxy.tls?.enabled;
}

function tlsCommonParams(tls) {
    const reality = tls?.reality;
    if (reality?.enabled) {
        // Reality authenticates the server itself; the official sample sets no tls-verification here
        if (!reality.public_key) unsupported('reality without public key');
        const parts = [param('reality-base64-pubkey', reality.public_key)];
        if (reality.short_id) parts.push(param('reality-hex-shortid', reality.short_id));
        return parts;
    }
    return [param('tls-verification', !tls?.insecure)];
}

function udpRelay(proxy) {
    // Same default as the Clash builder: enabled unless the source explicitly disables it
    return param('udp-relay', proxy.udp !== false);
}

// Shared by vmess/vless. SNI goes to tls-host and obfs-host only carries the ws/http Host,
// matching Sub-Store's QX producer (widely used in practice), so Host != SNI stays expressible.
function v2rayTransportParams(proxy) {
    const transport = proxy.transport;
    const type = transport?.type || 'tcp';
    const tls = isTlsEnabled(proxy);
    const sni = proxy.tls?.server_name;
    const parts = [];

    if (type === 'tcp') {
        if (tls) parts.push('obfs=over-tls');
    } else if (type === 'ws') {
        parts.push(tls ? 'obfs=wss' : 'obfs=ws');
        const host = getHostHeader(transport) || (tls ? sni : undefined);
        if (host) parts.push(param('obfs-host', host));
        parts.push(param('obfs-uri', getPath(transport) || '/'));
    } else if (type === 'http') {
        if (tls) unsupported('http obfs over tls');
        parts.push('obfs=http');
        const host = getHostHeader(transport);
        if (host) parts.push(param('obfs-host', host));
        parts.push(param('obfs-uri', getPath(transport) || '/'));
    } else {
        unsupported(`transport ${type}`);
    }

    if (tls) {
        if (sni) parts.push(param('tls-host', sni));
        parts.push(...tlsCommonParams(proxy.tls));
    }
    return parts;
}

function convertShadowsocks(proxy) {
    const method = proxy.method || 'none';
    if (!SS_METHODS.has(method)) unsupported(`cipher ${method}`);
    const parts = [
        `shadowsocks=${formatServer(proxy.server, proxy.server_port)}`,
        param('method', method),
        param('password', proxy.password ?? '')
    ];

    if (proxy.plugin) {
        const opts = normalizePluginOpts(proxy.plugin_opts);
        if (proxy.plugin === 'obfs' || proxy.plugin === 'obfs-local') {
            const mode = opts.mode || 'http';
            if (mode !== 'http' && mode !== 'tls') unsupported(`obfs mode ${mode}`);
            parts.push(param('obfs', mode));
            if (opts.host) parts.push(param('obfs-host', opts.host));
            if (mode === 'http' && opts.path) parts.push(param('obfs-uri', opts.path));
        } else if (proxy.plugin === 'v2ray-plugin' && (!opts.mode || opts.mode === 'websocket')) {
            const tls = opts.tls === true || opts.tls === 'true';
            parts.push(tls ? 'obfs=wss' : 'obfs=ws');
            if (opts.host) parts.push(param('obfs-host', opts.host));
            parts.push(param('obfs-uri', opts.path || '/'));
        } else {
            unsupported(`plugin ${proxy.plugin}`);
        }
    }

    parts.push(udpRelay(proxy));
    return parts;
}

function convertVmess(proxy) {
    const security = proxy.security || 'auto';
    const method = security === 'zero' ? 'none' : (VMESS_METHODS.has(security) ? security : 'chacha20-poly1305');
    return [
        `vmess=${formatServer(proxy.server, proxy.server_port)}`,
        param('method', method),
        param('password', proxy.uuid ?? ''),
        ...v2rayTransportParams(proxy),
        param('aead', !(Number(proxy.alter_id) > 0)),
        udpRelay(proxy)
    ];
}

function convertVless(proxy) {
    const parts = [
        `vless=${formatServer(proxy.server, proxy.server_port)}`,
        'method=none',
        param('password', proxy.uuid ?? ''),
        ...v2rayTransportParams(proxy)
    ];
    if (proxy.flow) {
        // -udp443 is a client-side Xray switch (allow UDP/443); the wire protocol and the
        // server's flow are plain vision, which is the only flow QX speaks.
        const flow = proxy.flow === 'xtls-rprx-vision-udp443' ? 'xtls-rprx-vision' : proxy.flow;
        if (flow !== 'xtls-rprx-vision') unsupported(`flow ${proxy.flow}`);
        if (!isTlsEnabled(proxy)) unsupported('vision flow without tls');
        parts.push(param('vless-flow', flow));
    }
    parts.push(udpRelay(proxy));
    return parts;
}

function convertTrojan(proxy) {
    const parts = [
        `trojan=${formatServer(proxy.server, proxy.server_port)}`,
        param('password', proxy.password ?? '')
    ];
    const type = proxy.transport?.type || 'tcp';
    const sni = proxy.tls?.server_name;
    if (proxy.tls && proxy.tls.enabled === false) unsupported('trojan without tls');

    if (type === 'ws') {
        // QX only supports websocket over tls for trojan
        parts.push('obfs=wss');
        const host = getHostHeader(proxy.transport) || sni;
        if (host) parts.push(param('obfs-host', host));
        parts.push(param('obfs-uri', getPath(proxy.transport) || '/'));
    } else if (type === 'tcp') {
        parts.push('over-tls=true');
    } else {
        unsupported(`transport ${type}`);
    }
    if (sni) parts.push(param('tls-host', sni));

    parts.push(...tlsCommonParams(proxy.tls));
    parts.push(udpRelay(proxy));
    return parts;
}

function convertAnytls(proxy) {
    const parts = [
        `anytls=${formatServer(proxy.server, proxy.server_port)}`,
        param('password', proxy.password ?? ''),
        'over-tls=true'
    ];
    if (proxy.tls?.server_name) parts.push(param('tls-host', proxy.tls.server_name));
    parts.push(...tlsCommonParams(proxy.tls));
    parts.push(udpRelay(proxy));
    return parts;
}

const CONVERTERS = {
    shadowsocks: convertShadowsocks,
    vmess: convertVmess,
    vless: convertVless,
    trojan: convertTrojan,
    anytls: convertAnytls
};

export function formatQuanxProxy(proxy) {
    return `${proxy.body}, tag=${proxy.tag}`;
}

export class QuanxConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry, includeAutoSelect = true) {
        super(inputString, QUANX_CONFIG, lang, userAgent, groupByCountry, includeAutoSelect);
        this.config.sections = mergeQuanxSections(QUANX_CONFIG.sections, baseConfig?.sections);
        this.selectedRules = selectedRules;
        this.customRules = customRules;
        this.countryGroupNames = [];
        this.manualGroupName = null;
        this.unsupportedProxies = [];
        this.config.proxies = [];
        this.config.policies = [];
    }

    // Overrides from Clash/Sing-Box/Surge subscriptions use foreign keys and group syntax
    // that would corrupt a QX profile; only their proxies are kept.
    applyConfigOverrides() { }

    getProxies() {
        return this.config.proxies;
    }

    getProxyName(proxy) {
        return proxy.tag;
    }

    // Proxies are kept as { tag, body } so dedup/renaming only touches the tag
    convertProxy(proxy) {
        const tag = sanitizeQuanxName(proxy.tag);
        const converter = CONVERTERS[proxy.type];
        try {
            if (!converter) unsupported(`type ${proxy.type}`);
            if (!tag) unsupported('empty name');
            return { tag, body: converter(proxy).join(', ') };
        } catch (error) {
            // One malformed node must not break the whole profile
            const reason = error instanceof UnsupportedProxyError ? error.message : 'invalid proxy';
            // Reasons echo subscription values; a newline would escape the comment line
            this.unsupportedProxies.push(`${tag || proxy.type} - ${reason}`.replace(/[\r\n]+/g, ' '));
            return null;
        }
    }

    addProxyToConfig(proxy) {
        addProxyWithDedup(this.config.proxies, proxy, {
            isSame: (a, b) => a.body === b.body
        });
    }

    hasPolicy(name) {
        return this.config.policies.some(policy => policy.name === name);
    }

    addPolicy(name, type, members) {
        const policyName = sanitizeQuanxName(name);
        if (!policyName || this.hasPolicy(policyName)) return;
        this.config.policies.push({ name: policyName, type, members: uniqueNames(members) });
    }

    buildSelectorOptions(proxyList) {
        return buildSelectorMembers({
            proxyList,
            translator: this.t,
            groupByCountry: this.groupByCountry,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames,
            includeAutoSelect: this.includeAutoSelect
        });
    }

    addAutoSelectGroup(proxyList) {
        if (!this.includeAutoSelect) return;
        this.addPolicy(this.t('outboundNames.Auto Select'), 'url-latency-benchmark', proxyList);
    }

    addNodeSelectGroup(proxyList) {
        this.addPolicy(this.t('outboundNames.Node Select'), 'static', buildNodeSelectMembers({
            proxyList,
            translator: this.t,
            includeAutoSelect: this.includeAutoSelect
        }));
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound === 'Node Select') return;
            let options = this.buildSelectorOptions(proxyList);
            if (DIRECT_DEFAULT_RULES.has(outbound)) {
                options = ['DIRECT', ...options.filter(p => p !== 'DIRECT')];
            }
            this.addPolicy(this.t(`outboundNames.${outbound}`), 'static', options);
        });
    }

    addCustomRuleGroups(proxyList) {
        if (!Array.isArray(this.customRules)) return;
        this.customRules.forEach(rule => {
            this.addPolicy(rule.name, 'static', buildCustomRuleMembers({
                proxyList,
                translator: this.t,
                manualGroupName: this.manualGroupName,
                includeAutoSelect: this.includeAutoSelect
            }));
        });
    }

    addFallBackGroup(proxyList) {
        this.addPolicy(this.t('outboundNames.Fall Back'), 'static', this.buildSelectorOptions(proxyList));
    }

    addCountryGroups() {
        const proxies = this.getProxies();
        const countryGroups = groupProxiesByCountry(proxies, { getName: proxy => proxy.tag });
        const manualProxyNames = proxies.map(proxy => proxy.tag);
        const manualGroupName = manualProxyNames.length > 0 ? sanitizeQuanxName(this.t('outboundNames.Manual Switch')) : null;
        if (manualGroupName) {
            this.addPolicy(manualGroupName, 'static', manualProxyNames);
        }

        const countryGroupNames = Object.keys(countryGroups)
            .sort((a, b) => a.localeCompare(b))
            .map(country => {
                const { emoji, name, proxies: members } = countryGroups[country];
                const groupName = sanitizeQuanxName(`${emoji} ${name}`);
                this.addPolicy(groupName, 'url-latency-benchmark', members);
                return groupName;
            });

        const nodeSelectName = sanitizeQuanxName(this.t('outboundNames.Node Select'));
        const nodeSelect = this.config.policies.find(policy => policy.name === nodeSelectName);
        if (nodeSelect) {
            nodeSelect.members = uniqueNames(buildNodeSelectMembers({
                proxyList: [],
                translator: this.t,
                groupByCountry: true,
                manualGroupName,
                countryGroupNames,
                includeAutoSelect: this.includeAutoSelect
            }));
        }
        this.countryGroupNames = countryGroupNames;
        this.manualGroupName = manualGroupName;
    }

    formatPolicy({ name, type, members }) {
        const mapped = members.map(member => BUILTIN_POLICIES[member] || sanitizeQuanxName(member));
        // QX rejects empty policies and latency tests need real servers
        if (mapped.length === 0) {
            return `static=${name}, direct`;
        }
        // QX refuses a latency group with a single member (subconverter downgrades it the same way)
        if (type === 'url-latency-benchmark' && mapped.length >= 2) {
            return `url-latency-benchmark=${name}, ${mapped.join(', ')}, ${LATENCY_PARAMS}`;
        }
        return `static=${name}, ${mapped.join(', ')}`;
    }

    policyName(outbound) {
        return sanitizeQuanxName(this.t(`outboundNames.${outbound}`));
    }

    buildRemoteFilters(rules) {
        const lines = [];
        const usedTags = new Set();
        const add = (url, id, policy) => {
            let tag = sanitizeQuanxName(`${id} - ${policy}`);
            for (let i = 2; usedTags.has(tag); i++) tag = sanitizeQuanxName(`${id} - ${policy} ${i}`);
            usedTags.add(tag);
            lines.push(`${url}, tag=${tag}, force-policy=${policy}, update-interval=${REMOTE_UPDATE_INTERVAL}, opt-parser=true, enabled=true`);
        };
        // Domain lists first so IP lists (which need DNS) are evaluated last
        rules.forEach(rule => (rule.site_rules || []).filter(Boolean).forEach(site => {
            add(`${SURGE_SITE_RULE_SET_BASEURL}${site}.conf`, `geosite:${site}`, rule.policy);
        }));
        rules.forEach(rule => (rule.ip_rules || []).filter(Boolean).forEach(ip => {
            add(`${SURGE_IP_RULE_SET_BASEURL}${ip}.txt`, `geoip:${ip}`, rule.policy);
        }));
        return lines;
    }

    buildLocalFilters(rules) {
        const lines = [];
        const push = (type, value, policy) => {
            const str = typeof value === 'string' ? value.trim() : '';
            if (!str || /[,\s]/.test(str)) return;
            lines.push(`${type}, ${str}, ${policy}`);
        };
        rules.forEach(rule => (rule.domain_suffix || []).forEach(v => push('host-suffix', v, rule.policy)));
        rules.forEach(rule => (rule.domain_keyword || []).forEach(v => push('host-keyword', v, rule.policy)));
        rules.forEach(rule => (rule.ip_cidr || []).forEach(v => {
            push(typeof v === 'string' && v.includes(':') ? 'ip6-cidr' : 'ip-cidr', v, rule.policy);
        }));
        rules.forEach(rule => (rule.src_ip_cidr || []).forEach(v => {
            if (typeof v === 'string' && v.trim()) {
                lines.push(`# source IP rules are not supported by Quantumult X, skipped: ${v.trim().replace(/[\r\n]+/g, '')}`);
            }
        }));
        lines.push(`final, ${this.policyName('Fall Back')}`);
        return lines;
    }

    nodeLines() {
        return [
            ...this.config.proxies.map(formatQuanxProxy),
            ...this.unsupportedProxies.map(item => `# Unsupported by Quantumult X: ${item}`)
        ];
    }

    // Bare server lines for a QX [server_remote] resource, like Sub-Store/subconverter node lists
    formatNodeList() {
        return this.nodeLines().join('\n') + '\n';
    }

    // Without a usable node every policy would collapse to direct and the profile would
    // silently stop proxying, so fail loudly with the per-node reasons instead.
    assertHasProxies() {
        if (this.config.proxies.length > 0) return;
        const list = (title, items) => items.length > 0 ? `\n${title}:\n${items.map(item => `- ${item}`).join('\n')}` : '';
        throw new InvalidPayloadError(
            'No Quantumult X compatible nodes found (QX supports ss/vmess/vless/trojan/anytls over tcp/ws/http only).'
            + list('Skipped', this.unsupportedProxies)
            + list('Not parsed', this.inputDiagnostics)
        );
    }

    addSelectors() {
        this.assertHasProxies();
        super.addSelectors();
    }

    // Skips policy/rule generation that build() would do and a node list never uses
    async buildNodeList() {
        this.addCustomItems(await this.parseCustomItems());
        this.assertHasProxies();
        return this.formatNodeList();
    }

    formatConfig() {
        const customRules = Array.isArray(this.customRules) ? this.customRules : [];
        // Copy: generateRules reverses customRules in place and formatConfig runs twice per request.
        // It prepends one entry per custom rule, so the first customRules.length entries are custom;
        // their names are user-defined and must not go through i18n (policies are created the same way).
        const rules = generateRules(this.selectedRules, [...customRules]).map((rule, index) => ({
            ...rule,
            policy: index < customRules.length ? sanitizeQuanxName(rule.outbound) : this.policyName(rule.outbound)
        })).filter(rule => rule.policy); // a nameless custom rule has no policy to point at
        const generated = {
            policy: this.config.policies.map(policy => this.formatPolicy(policy)),
            filter_remote: this.buildRemoteFilters(rules),
            server_local: this.nodeLines(),
            filter_local: this.buildLocalFilters(rules)
        };
        const sections = this.config.sections || {};
        const names = [...SECTION_ORDER, ...Object.keys(sections).filter(name => !SECTION_ORDER.includes(name))];

        return names
            .map(name => {
                const lines = Object.hasOwn(generated, name) ? generated[name] : (Object.hasOwn(sections, name) ? sections[name] : []);
                return [`[${name}]`, ...lines].join('\n');
            })
            .join('\n\n') + '\n';
    }
}
