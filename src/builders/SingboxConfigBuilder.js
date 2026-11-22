
import { SING_BOX_CONFIG, generateRuleSets, generateRules, getOutbounds, PREDEFINED_RULE_SETS, DIRECT_DEFAULT_RULES, REJECT_ACTION_RULES } from '../config/index.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { deepCopy, groupProxiesByCountry } from '../utils.js';
import { addProxyWithDedup } from './helpers/proxyHelpers.js';
import { buildSelectorMembers as buildSelectorMemberList, buildNodeSelectMembers, buildCustomRuleMembers, uniqueNames } from './helpers/groupBuilder.js';
import { normalizeGroupName } from './helpers/groupNameUtils.js';
import { translations } from '../i18n/index.js';

// Every locale's name for the node selector, so a template written in one
// language keeps pointing at the group after translation.
const NODE_SELECT_NAMES = new Set(
    Object.values(translations)
        .map(lang => lang?.outboundNames?.['Node Select'])
        .filter(Boolean)
);

const RULE_SET_HTTP_CLIENT_TAG = 'rule-set-download';
const ANYTLS_OPTION_KEYS = {
    'idle-session-check-interval': 'idle_session_check_interval',
    'idle-session-timeout': 'idle_session_timeout',
    'min-idle-session': 'min_idle_session'
};

// sing-box V2Ray transports and the fields each accepts; sing-box rejects
// unknown types and fields, so one stray value would fail the whole config.
const SINGBOX_TRANSPORT_FIELDS = {
    http: ['host', 'path', 'method', 'headers', 'idle_timeout', 'ping_timeout'],
    ws: ['path', 'headers', 'max_early_data', 'early_data_header_name'],
    quic: [],
    grpc: ['service_name', 'idle_timeout', 'ping_timeout', 'permit_without_stream'],
    httpupgrade: ['host', 'path', 'headers']
};
const SINGBOX_TRANSPORT_ALIASES = { h2: 'http' };

// Returns null when sing-box has no equivalent (xhttp, kcp, ...): dropping
// that node keeps the rest of the config loadable.
function toSingboxTransport(transport) {
    if (!transport?.type) return undefined;
    const type = SINGBOX_TRANSPORT_ALIASES[transport.type] ?? transport.type;
    const fields = SINGBOX_TRANSPORT_FIELDS[type];
    if (!fields) return null;
    const result = { type };
    fields.forEach((key) => {
        if (transport[key] !== undefined) result[key] = transport[key];
    });
    return result;
}

// sing-box bundles only these SIP003 plugins, keyed by the IR's Clash names.
const SINGBOX_SS_PLUGINS = {
    obfs: { name: 'obfs-local', keys: { mode: 'obfs', host: 'obfs-host' } },
    'v2ray-plugin': { name: 'v2ray-plugin', keys: {} }
};

// SIP003 reserves these as separators inside the options string.
const escapeSip003 = (value) => String(value).replace(/[\\=;]/g, '\\$&');

// sing-box reads plugin options as a SIP003 string ("obfs=http;obfs-host=a.com")
// where a bare key is a flag, and fails the whole config on an object. Returns
// null when sing-box lacks the plugin, so only that node is dropped.
function toSingboxPlugin(plugin, opts) {
    const spec = SINGBOX_SS_PLUGINS[plugin];
    if (!spec) return null;
    const pluginOpts = Object.entries(opts ?? {}).flatMap(([key, value]) => {
        const name = spec.keys[key] ?? key;
        if (value === true) return [name];
        // sing-box enables `tls` by mere presence, but reads `mux` as a
        // count whose absence means 1, so false needs a different spelling.
        if (value === false) return name === 'mux' ? ['mux=0'] : [];
        if (value == null || typeof value === 'object') return [];
        return [`${name}=${escapeSip003(value)}`];
    }).join(';');
    return { plugin: spec.name, ...(pluginOpts ? { plugin_opts: pluginOpts } : {}) };
}

function isDirectDnsServer(server, outbounds = []) {
    if (!server?.tag || server.type === 'fakeip') return false;
    if (!server.detour) return true;

    // A detour is proxy-independent only when its actual target is direct.
    const target = outbounds.find(outbound => outbound?.tag === server.detour);
    return target?.type === 'direct' && !target.detour;
}

const IPV4_LITERAL = /^\d{1,3}(?:\.\d{1,3}){3}$/;

// Every IPv6 literal carries a colon, so this only says "not a name" cheaply.
const isDomainAddress = (server) =>
    typeof server === 'string' && server.length > 0 && !IPV4_LITERAL.test(server) && !server.includes(':');

// Tags people give the DNS server meant for node bootstrap, remote first.
const NODE_RESOLVER_TAGS = [/proxy|remote/i, /resolver|local|direct|bootstrap/i];

// A node dials its own server before any proxy exists, so the resolver must be
// reachable without it. A DNS server whose own address is a name still works,
// but only when it names a direct resolver that is itself reachable.
function hasOwnBootstrap(server, servers, outbounds) {
    if (!isDomainAddress(server.server)) return true;
    const ownTag = typeof server.domain_resolver === 'string'
        ? server.domain_resolver
        : server.domain_resolver?.server;
    const own = servers.find(candidate => candidate?.tag === ownTag);
    return Boolean(own && own !== server && !isDomainAddress(own.server) && isDirectDnsServer(own, outbounds));
}

export class SingboxConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry = false, enableClashUI = false, externalController, externalUiDownloadUrl, singboxVersion = '1.12', includeAutoSelect = true) {
        const resolvedBaseConfig = baseConfig ?? SING_BOX_CONFIG;
        super(inputString, resolvedBaseConfig, lang, userAgent, groupByCountry, includeAutoSelect);

        this.selectedRules = selectedRules;
        this.customRules = customRules;
        this.countryGroupNames = [];
        this.manualGroupName = null;
        this.enableClashUI = enableClashUI;
        this.externalController = externalController;
        this.externalUiDownloadUrl = externalUiDownloadUrl;
        this.singboxVersion = singboxVersion;  // '1.11', '1.12' or '1.14'

        // The template ships the zh-CN selector name and the group is renamed per
        // language, so re-translate a detour that already pointed at the
        // selector. Never invent one: a resolver a template left direct has to
        // stay reachable, or node domains cannot be bootstrapped at all.
        const nodeSelectTag = this.t('outboundNames.Node Select');
        this.config?.dns?.servers?.forEach(server => {
            if (server?.detour && NODE_SELECT_NAMES.has(server.detour)) {
                server.detour = nodeSelectTag;
            }
        });
    }

    getProxies() {
        return this.config.outbounds.filter(outbound => outbound?.server != undefined);
    }

    getProxyName(proxy) {
        return proxy.tag;
    }

    convertProxy(proxy) {
        // sing-box has no VLESS encryption option and the server rejects clients
        // without it, so emitting the node would only add a dead outbound.
        if (proxy.type === 'vless' && proxy.encryption) return null;
        // AnyTLS arrived in sing-box 1.12; 1.11 rejects the unknown outbound
        // type and with it the whole config.
        if (proxy.type === 'anytls' && this.singboxVersion === '1.11') return null;

        // Create a shallow copy to avoid mutating the original
        const sanitized = { ...proxy };

        // URI and Clash inputs use Mihomo's kebab-case names, while sing-box
        // rejects those keys and requires its native snake_case options.
        if (sanitized.type === 'anytls') {
            Object.entries(ANYTLS_OPTION_KEYS).forEach(([sourceKey, targetKey]) => {
                if (sanitized[sourceKey] !== undefined && sanitized[targetKey] === undefined) {
                    sanitized[targetKey] = sanitized[sourceKey];
                }
                delete sanitized[sourceKey];
            });
            // sing-box types the two idle intervals as Duration strings ("30s"),
            // while share links and Mihomo carry plain seconds
            ['idle_session_check_interval', 'idle_session_timeout'].forEach((key) => {
                if (typeof sanitized[key] === 'number') {
                    sanitized[key] = `${sanitized[key]}s`;
                }
            });
        }

        // Strip Clash-only / mis-typed fields that conflict with sing-box semantics.
        // `udp` is Clash-only. Top-level `network` in sing-box is a TCP/UDP allowlist
        // (NetworkList in option/types.go); a stray "tcp" silently disables UDP for
        // every group that selects this node — including DNS hijack and fakeip.
        delete sanitized.udp;
        delete sanitized.network;

        if (sanitized.plugin) {
            const plugin = toSingboxPlugin(sanitized.plugin, sanitized.plugin_opts);
            if (!plugin) return null;
            delete sanitized.plugin_opts;
            Object.assign(sanitized, plugin);
        }

        const transport = toSingboxTransport(sanitized.transport);
        if (transport === null) return null;
        if (transport) sanitized.transport = transport;
        else delete sanitized.transport;

        // This Mihomo-only Reality option is not part of the sing-box TLS schema.
        if (sanitized.tls?.reality?.support_x25519mlkem768 !== undefined) {
            sanitized.tls = { ...sanitized.tls, reality: { ...sanitized.tls.reality } };
            delete sanitized.tls.reality.support_x25519mlkem768;
        }

        // Remove 'alpn' from root level - it should only exist inside 'tls' object for sing-box
        // For protocols like vless/vmess, alpn belongs inside the tls configuration
        if (sanitized.alpn && sanitized.tls) {
            // Move alpn into tls if tls exists and doesn't have alpn
            if (!sanitized.tls.alpn) {
                sanitized.tls = { ...sanitized.tls, alpn: sanitized.alpn };
            }
            delete sanitized.alpn;
        } else if (sanitized.alpn && !sanitized.tls) {
            // No TLS, remove alpn entirely
            delete sanitized.alpn;
        }

        // Remove packet_encoding for now - it's version-specific in sing-box
        // xudp is default in newer versions
        delete sanitized.packet_encoding;

        if (sanitized.type === 'hysteria2') {
            // sing-box names port-hopping/bandwidth fields differently from the
            // share-link shape, and rejects unknown fields outright
            if (sanitized.ports) {
                const ranges = String(sanitized.ports).split(',')
                    .map(range => range.trim().replace('-', ':'))
                    .filter(Boolean);
                if (ranges.length > 0) {
                    sanitized.server_ports = ranges;
                }
                delete sanitized.ports;
            }
            if (typeof sanitized.hop_interval === 'number') {
                sanitized.hop_interval = `${sanitized.hop_interval}s`;
            }
            if (sanitized.up !== undefined) {
                sanitized.up_mbps = sanitized.up;
                delete sanitized.up;
            }
            if (sanitized.down !== undefined) {
                sanitized.down_mbps = sanitized.down;
                delete sanitized.down;
            }
            delete sanitized.auth;
            delete sanitized.recv_window_conn;
            delete sanitized.fast_open;
        }

        return sanitized;
    }

    addProxyToConfig(proxy) {
        this.config.outbounds = this.config.outbounds || [];
        addProxyWithDedup(this.config.outbounds, proxy, {
            getName: (item) => item?.tag,
            setName: (item, name) => {
                if (item) item.tag = name;
            },
            isSame: (existing = {}, incoming = {}) => {
                const { tag: _incomingTag, ...restIncoming } = incoming;
                const { tag: _existingTag, ...restExisting } = existing;
                return JSON.stringify(restIncoming) === JSON.stringify(restExisting);
            }
        });
    }

    hasOutboundTag(tag) {
        const target = normalizeGroupName(tag);
        return (this.config.outbounds || []).some(outbound => normalizeGroupName(outbound?.tag) === target);
    }

    hasAutoSelectCandidates(proxyList = this.getProxyList()) {
        return Array.isArray(proxyList) && proxyList.length > 0;
    }

    addAutoSelectGroup(proxyList) {
        if (!this.includeAutoSelect) return;
        this.config.outbounds = this.config.outbounds || [];
        const tag = this.t('outboundNames.Auto Select');
        if (this.hasOutboundTag(tag)) return;
        const autoSelectMembers = deepCopy(uniqueNames(proxyList));
        if (autoSelectMembers.length === 0) return;

        const group = {
            type: "urltest",
            tag,
            outbounds: autoSelectMembers
        };

        this.config.outbounds.unshift(group);
    }

    addNodeSelectGroup(proxyList) {
        this.config.outbounds = this.config.outbounds || [];
        const tag = this.t('outboundNames.Node Select');
        if (this.hasOutboundTag(tag)) return;
        const includeAutoSelect = this.includeAutoSelect && this.hasAutoSelectCandidates(proxyList);
        const members = buildNodeSelectMembers({
            proxyList,
            translator: this.t,
            groupByCountry: this.groupByCountry,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames,
            includeAutoSelect,
            includeReject: false
        });

        const group = {
            type: "selector",
            tag,
            outbounds: members
        };

        this.config.outbounds.unshift(group);
    }

    buildSelectorMembers(proxyList = []) {
        return buildSelectorMemberList({
            proxyList,
            translator: this.t,
            groupByCountry: this.groupByCountry,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames,
            includeAutoSelect: this.includeAutoSelect && this.hasAutoSelectCandidates(proxyList),
            includeReject: false
        });
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound !== this.t('outboundNames.Node Select')) {
                if (REJECT_ACTION_RULES.has(outbound)) return;
                let selectorMembers = this.buildSelectorMembers(proxyList);
                const tag = this.t(`outboundNames.${outbound}`);
                if (this.hasOutboundTag(tag)) {
                    return;
                }
                // For rules that should default to DIRECT, move DIRECT to the front
                if (DIRECT_DEFAULT_RULES.has(outbound)) {
                    selectorMembers = ['DIRECT', ...selectorMembers.filter(p => p !== 'DIRECT')];
                }
                this.config.outbounds.push({
                    type: "selector",
                    tag,
                    outbounds: selectorMembers
                });
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                const includeAutoSelect = this.includeAutoSelect && this.hasAutoSelectCandidates(proxyList);
                const selectorMembers = buildCustomRuleMembers({
                    proxyList,
                    translator: this.t,
                    manualGroupName: this.manualGroupName,
                    includeAutoSelect,
                    includeReject: false
                });
                if (this.hasOutboundTag(rule.name)) return;
                this.config.outbounds.push({
                    type: "selector",
                    tag: rule.name,
                    outbounds: selectorMembers
                });
            });
        }
    }

    addFallBackGroup(proxyList) {
        const selectorMembers = this.buildSelectorMembers(proxyList);
        if (this.hasOutboundTag(this.t('outboundNames.Fall Back'))) return;
        this.config.outbounds.push({
            type: "selector",
            tag: this.t('outboundNames.Fall Back'),
            outbounds: selectorMembers
        });
    }

    addCountryGroups() {
        const proxies = this.getProxies();
        const countryGroups = groupProxiesByCountry(proxies, {
            getName: proxy => this.getProxyName(proxy)
        });

        const existingTags = new Set((this.config.outbounds || []).map(o => normalizeGroupName(o?.tag)).filter(Boolean));

        const manualProxyNames = proxies.map(p => p?.tag).filter(Boolean);
        const manualGroupName = manualProxyNames.length > 0 ? this.t('outboundNames.Manual Switch') : null;
        if (manualGroupName) {
            const manualNorm = normalizeGroupName(manualGroupName);
            if (!existingTags.has(manualNorm)) {
                this.config.outbounds.push({
                    type: 'selector',
                    tag: manualGroupName,
                    outbounds: manualProxyNames
                });
                existingTags.add(manualNorm);
            }
        }

        const countries = Object.keys(countryGroups).sort((a, b) => a.localeCompare(b));
        const countryGroupNames = [];
        const includeAutoSelect = this.includeAutoSelect && this.hasAutoSelectCandidates();

        countries.forEach(country => {
            const { emoji, name, proxies: countryProxies } = countryGroups[country];
            if (!countryProxies || countryProxies.length === 0) {
                return;
            }
            const groupName = `${emoji} ${name}`;
            const norm = normalizeGroupName(groupName);
            if (!existingTags.has(norm)) {
                this.config.outbounds.push({
                    tag: groupName,
                    type: 'urltest',
                    outbounds: countryProxies
                });
                existingTags.add(norm);
            }
            countryGroupNames.push(groupName);
        });

        const nodeSelectTag = this.t('outboundNames.Node Select');
        const nodeSelectGroup = this.config.outbounds.find(o => normalizeGroupName(o?.tag) === normalizeGroupName(nodeSelectTag));
        if (nodeSelectGroup && Array.isArray(nodeSelectGroup.outbounds)) {
            const rebuilt = buildNodeSelectMembers({
                proxyList: [],
                translator: this.t,
                groupByCountry: true,
                manualGroupName,
                countryGroupNames,
                includeAutoSelect,
                includeReject: false
            });
            nodeSelectGroup.outbounds = rebuilt;
        }

        this.countryGroupNames = countryGroupNames;
        this.manualGroupName = manualGroupName;
    }

    /**
     * Merge user-defined proxy groups (selector/urltest outbounds) with system-generated ones
     * Handles same-tag groups by merging outbound references
     * @param {Array} userGroups - User-defined proxy groups from input config (converted to Clash format)
     */
    mergeUserProxyGroups(userGroups) {
        if (!Array.isArray(userGroups)) return;

        const proxyList = this.getProxyList();

        // Build valid reference set (proxy tags, group tags, special names)
        const groupTags = new Set(
            (this.config.outbounds || [])
                .filter(o => o.type === 'selector' || o.type === 'urltest')
                .map(o => normalizeGroupName(o?.tag))
                .filter(Boolean)
        );
        const validRefs = new Set(['DIRECT', 'direct']);
        proxyList.forEach(n => validRefs.add(n));
        groupTags.forEach(n => validRefs.add(n));

        // Resolve forward references without retaining groups backed only by unsupported providers.
        let resolvedGroup = true;
        while (resolvedGroup) {
            resolvedGroup = false;
            userGroups.forEach(group => {
                if (group?.name && !validRefs.has(group.name) &&
                    Array.isArray(group.proxies) && group.proxies.some(name => validRefs.has(name))) {
                    validRefs.add(group.name);
                    resolvedGroup = true;
                }
            });
        }

        userGroups.forEach(userGroup => {
            if (!userGroup?.name) return;

            const existingIndex = (this.config.outbounds || []).findIndex(o =>
                normalizeGroupName(o?.tag) === normalizeGroupName(userGroup.name)
            );
            const outbound = existingIndex >= 0 ? this.config.outbounds[existingIndex] : {
                type: userGroup.type === 'url-test' ? 'urltest' : 'selector',
                tag: userGroup.name,
                outbounds: []
            };

            if (Array.isArray(userGroup.proxies)) {
                const validUserOutbounds = userGroup.proxies.filter(p => validRefs.has(p));
                outbound.outbounds = [...new Set([
                    ...(outbound.outbounds || []),
                    ...validUserOutbounds
                ])];
            }

            if (outbound.type === 'urltest') {
                if (userGroup.url) outbound.url = userGroup.url;
                if (typeof userGroup.interval === 'number') {
                    outbound.interval = `${userGroup.interval}s`;
                }
            }

            if (existingIndex < 0 && outbound.outbounds?.length > 0) {
                this.config.outbounds.push(outbound);
            }
        });
    }

    /**
     * Validate outbounds before final output
     * Ensures urltest groups have outbounds, fills empty ones with all proxy tags
     */
    validateOutbounds() {
        const proxyList = this.getProxyList();
        const invalidTags = new Set();

        (this.config.outbounds || []).forEach(outbound => {
            if (outbound.type === 'urltest' &&
                (!outbound.outbounds || outbound.outbounds.length === 0)) {
                outbound.outbounds = [...proxyList];
                if (outbound.outbounds.length === 0) {
                    invalidTags.add(normalizeGroupName(outbound.tag));
                }
            }
        });

        if (invalidTags.size > 0) {
            this.config.outbounds = (this.config.outbounds || [])
                .filter(outbound => !invalidTags.has(normalizeGroupName(outbound?.tag)))
                .map(outbound => {
                    if (Array.isArray(outbound.outbounds)) {
                        outbound.outbounds = outbound.outbounds.filter(tag => !invalidTags.has(normalizeGroupName(tag)));
                    }
                    return outbound;
                });
        }
    }

    sanitizeLegacySpecialOutbounds() {
        const legacyTags = new Set(
            (this.config.outbounds || [])
                .filter(outbound => outbound?.type === 'block' || outbound?.type === 'dns')
                .map(outbound => normalizeGroupName(outbound?.tag))
                .filter(Boolean)
        );
        legacyTags.add(normalizeGroupName('REJECT'));

        this.config.outbounds = (this.config.outbounds || [])
            .filter(outbound => !legacyTags.has(normalizeGroupName(outbound?.tag)))
            .map(outbound => {
                if (Array.isArray(outbound.outbounds)) {
                    outbound.outbounds = outbound.outbounds.filter(tag => !legacyTags.has(normalizeGroupName(tag)));
                }
                return outbound;
            })
            .filter(outbound => {
                if (outbound?.type !== 'selector' && outbound?.type !== 'urltest') return true;
                return outbound.outbounds?.length > 0;
            });
    }

    buildRouteTarget(rule) {
        if (REJECT_ACTION_RULES.has(rule?.outbound) || rule?.outbound === 'REJECT') {
            return { action: 'reject' };
        }
        return { outbound: this.t(`outboundNames.${rule.outbound}`) };
    }

    /**
     * Pin remote rule-set downloads to DIRECT so fetching never depends on a
     * proxy that may not be up yet (issue #408). sing-box 1.14 deprecates both
     * the implicit default HTTP client and the download_detour field (removed
     * in 1.16, issue #401), so >=1.14 gets an explicit shared HTTP client
     * while older versions get the legacy per-rule-set field.
     */
    configureRuleSetDownload() {
        if (this.singboxVersion === '1.14') {
            if (!this.config.route.default_http_client) {
                if (!Array.isArray(this.config.http_clients) || this.config.http_clients.length === 0) {
                    this.config.http_clients = [{ tag: RULE_SET_HTTP_CLIENT_TAG, detour: 'DIRECT' }];
                }
                this.config.route.default_http_client = this.config.http_clients[0].tag;
            }
            this.ensureDownloadTargetNotEmptyDirect();
            return;
        }
        this.config.route.rule_set.forEach(ruleSet => {
            if (ruleSet?.type === 'remote' && !ruleSet.download_detour) {
                ruleSet.download_detour = 'DIRECT';
            }
        });
    }

    /**
     * sing-box >=1.12 rejects a detour targeting an empty direct outbound
     * ("detour to an empty direct outbound makes no sense"), which kills every
     * remote rule-set download on the 1.14 tier. Give the detour target a
     * domain_resolver so it is no longer empty; mirroring
     * route.default_domain_resolver keeps this a no-op.
     */
    ensureDownloadTargetNotEmptyDirect() {
        const clientTag = this.config.route.default_http_client;
        const client = (this.config.http_clients || []).find(c => c?.tag === clientTag);
        if (!client?.detour) return;
        const target = (this.config.outbounds || []).find(o => o?.tag === client.detour);
        if (target?.type !== 'direct') return;
        const hasDialFields = Object.keys(target).some(key => key !== 'type' && key !== 'tag');
        if (hasDialFields) return;
        const candidates = (this.config.dns?.servers || []).filter(server => isDirectDnsServer(server, this.config.outbounds));
        const resolver = typeof this.config.route.default_domain_resolver === 'string'
            ? this.config.route.default_domain_resolver
            : (candidates.find(server => server.type === 'udp') || candidates[0])?.tag;
        if (resolver) {
            target.domain_resolver = resolver;
        }
    }

    /**
     * An explicit route resolver wins as long as it is not behind a proxy. Else
     * pick a direct server, preferring IP over name addresses and the tags this
     * repo and common templates use for the remote/local resolver.
     */
    resolveNodeResolver() {
        const servers = this.config.dns?.servers || [];
        const configured = this.config.route?.default_domain_resolver;
        const configuredTag = typeof configured === 'string' ? configured : configured?.server;
        const configuredServer = servers.find(server => server?.tag === configuredTag);
        if (configuredServer && isDirectDnsServer(configuredServer, this.config.outbounds)) {
            return configuredTag;
        }

        const direct = servers.filter(server => isDirectDnsServer(server, this.config.outbounds));
        // A resolver that needs a resolver of its own is the weaker choice.
        const reachable = [
            ...direct.filter(server => !isDomainAddress(server.server)),
            ...direct.filter(server => isDomainAddress(server.server)
                && hasOwnBootstrap(server, servers, this.config.outbounds))
        ];
        for (const pattern of NODE_RESOLVER_TAGS) {
            const match = reachable.find(server => pattern.test(server.tag ?? ''));
            if (match) return match.tag;
        }
        return undefined;
    }

    /**
     * sing-box >= 1.12 resolves a node's server name through `domain_resolver`
     * or the route default, and >= 1.14 no longer falls back implicitly. 1.11
     * has no dial fields at all, so it keeps relying on its DNS rule.
     */
    applyNodeDomainResolvers(resolverTag) {
        if (this.singboxVersion === '1.11' || !resolverTag) return;
        (this.config.outbounds || []).forEach(outbound => {
            if (!isDomainAddress(outbound?.server) || outbound.domain_resolver) return;
            outbound.domain_resolver = resolverTag;
        });
    }

    formatConfig() {
        const rules = generateRules(this.selectedRules, this.customRules);
        const { site_rule_sets, ip_rule_sets } = generateRuleSets(this.selectedRules, this.customRules);

        // Upstream configs can define route options without supplying any rules.
        this.config.route ??= {};
        this.config.route.rules ??= [];

        // Subscription route overrides must not make node bootstrap depend on proxy DNS.
        const nodeResolver = this.resolveNodeResolver();
        if (this.singboxVersion !== '1.11' && !this.config.route.default_domain_resolver && nodeResolver) {
            this.config.route.default_domain_resolver = nodeResolver;
        }

        this.config.route.rule_set = [...site_rule_sets, ...ip_rule_sets];
        this.configureRuleSetDownload();

        // Official sing-box rejects provider extensions, including those in custom templates.
        delete this.config.outbound_providers;
        (this.config.outbounds || []).forEach(outbound => {
            delete outbound.providers;
        });

        // Validate outbounds: fill empty urltest groups with all proxies
        this.validateOutbounds();
        this.applyNodeDomainResolvers(nodeResolver);
        this.sanitizeLegacySpecialOutbounds();

        const attachProtocolIfNeeded = (entry, rule) => {
            if (Array.isArray(rule?.protocol) && rule.protocol.length > 0) {
                entry.protocol = rule.protocol;
            }
            return entry;
        };

        const hasMatchValues = (value) => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'string') return value.trim() !== '';
            return false;
        };

        rules.filter(rule => Array.isArray(rule.src_ip_cidr) && rule.src_ip_cidr.length > 0).map(rule => {
            this.config.route.rules.push(attachProtocolIfNeeded({
                source_ip_cidr: rule.src_ip_cidr,
                ...this.buildRouteTarget(rule)
            }, rule));
        });

        rules.filter(rule => hasMatchValues(rule.domain_suffix) || hasMatchValues(rule.domain_keyword)).map(rule => {
            const entry = {
                ...this.buildRouteTarget(rule)
            };

            if (hasMatchValues(rule.domain_suffix)) entry.domain_suffix = rule.domain_suffix;
            if (hasMatchValues(rule.domain_keyword)) entry.domain_keyword = rule.domain_keyword;

            this.config.route.rules.push(attachProtocolIfNeeded(entry, rule));
        });

        rules.filter(rule => !!rule.site_rules[0]).map(rule => {
            this.config.route.rules.push(attachProtocolIfNeeded({
                rule_set: [
                    ...(rule.site_rules.length > 0 && rule.site_rules[0] !== '' ? rule.site_rules : []),
                ],
                ...this.buildRouteTarget(rule)
            }, rule));
        });

        rules.filter(rule => !!rule.ip_rules[0]).map(rule => {
            this.config.route.rules.push(attachProtocolIfNeeded({
                rule_set: [
                    ...(rule.ip_rules
                        .map(ip => ip.trim())
                        .filter(ip => ip !== '')
                        .map(ip => `${ip}-ip`))
                ],
                ...this.buildRouteTarget(rule)
            }, rule));
        });

        rules.filter(rule => hasMatchValues(rule.ip_cidr)).map(rule => {
            this.config.route.rules.push(attachProtocolIfNeeded({
                ip_cidr: rule.ip_cidr,
                ...this.buildRouteTarget(rule)
            }, rule));
        });

        // Order matters: sniff first so downstream rules can match on protocol;
        // hijack-dns before clash_mode so DNS never escapes into a selector when
        // the user toggles global mode (selectors only support TCP+UDP if the
        // currently selected node does, which is fragile).
        this.config.route.rules.unshift(
            { action: 'sniff' },
            { protocol: 'dns', action: 'hijack-dns' },
            { clash_mode: 'direct', outbound: 'DIRECT' },
            { clash_mode: 'global', outbound: this.t('outboundNames.Node Select') }
        );

        this.config.route.auto_detect_interface = true;
        this.config.route.final = this.t('outboundNames.Fall Back');
        // 如果启用了 Clash UI，添加配置
        // 如果启用 Clash UI 或传入了自定义参数，添加/覆盖 Clash API 配置
        if (this.enableClashUI || this.externalController || this.externalUiDownloadUrl) {
            const defaultExternalController = "0.0.0.0:9090";
            const defaultExternalUiDownloadUrl = "https://gh-proxy.org/https://github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip";
            const defaultExternalUi = "./ui";
            const defaultSecret = "";
            const defaultDownloadDetour = "DIRECT";
            const defaultClashMode = "rule";

            this.config.experimental = this.config.experimental || {};
            const existingClashApi = this.config.experimental.clash_api || {};

            const externalController = this.externalController || existingClashApi.external_controller || defaultExternalController;
            const externalUiDownloadUrl = this.externalUiDownloadUrl || existingClashApi.external_ui_download_url || defaultExternalUiDownloadUrl;
            const externalUi = existingClashApi.external_ui || defaultExternalUi;
            const secret = existingClashApi.secret ?? defaultSecret;
            const externalUiDownloadDetour = existingClashApi.external_ui_download_detour || defaultDownloadDetour;
            const clashMode = existingClashApi.default_mode || defaultClashMode;

            this.config.experimental.clash_api = {
                ...existingClashApi,
                external_controller: externalController,
                external_ui: externalUi,
                external_ui_download_url: externalUiDownloadUrl,
                external_ui_download_detour: externalUiDownloadDetour,
                secret,
                default_mode: clashMode
            };
        }
        return this.config;
    }
}
