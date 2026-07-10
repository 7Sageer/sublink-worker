import { SurgeConfigBuilder } from './SurgeConfigBuilder.js';
import {
    LOON_CONFIG,
    SURGE_SITE_RULE_SET_BASEURL,
    SURGE_IP_RULE_SET_BASEURL,
    generateRules
} from '../config/index.js';
import { InvalidPayloadError } from '../services/errors.js';

function cleanValue(value) {
    return `${value ?? ''}`.replace(/[\r\n]+/g, '').trim();
}

function quoteValue(value) {
    return `"${cleanValue(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function firstValue(value) {
    return Array.isArray(value) ? value[0] : value;
}

function getTransportHost(transport) {
    return firstValue(transport?.headers?.host ?? transport?.headers?.Host ?? transport?.host);
}

function getTransportPath(transport) {
    return firstValue(transport?.path);
}

function appendTransport(parts, transport) {
    const type = transport?.type || 'tcp';
    if (!['tcp', 'ws', 'http'].includes(type)) {
        return false;
    }

    parts.push(`transport=${type}`);
    const path = getTransportPath(transport);
    const host = getTransportHost(transport);
    if (path) parts.push(`path=${cleanValue(path)}`);
    if (host) parts.push(`host=${cleanValue(host)}`);
    return true;
}

function appendTls(parts, tls, { includeOverTls = false } = {}) {
    if (!tls?.enabled) return;
    if (includeOverTls) parts.push('over-tls=true');
    if (tls.insecure) parts.push('skip-cert-verify=true');

    const alpn = Array.isArray(tls.alpn) ? tls.alpn.join(',') : tls.alpn;
    if (alpn) parts.push(`alpn=${quoteValue(alpn)}`);

    const fingerprint = cleanValue(tls.utls?.fingerprint).toLowerCase();
    if (fingerprint === 'chrome') parts.push('tls-profile=chrome');
    if (fingerprint === 'ios') parts.push('tls-profile=ios26');

    if (tls.reality?.enabled) {
        if (tls.server_name) parts.push(`sni=${cleanValue(tls.server_name)}`);
        if (tls.reality.public_key) parts.push(`public-key=${quoteValue(tls.reality.public_key)}`);
        if (tls.reality.short_id) parts.push(`short-id=${cleanValue(tls.reality.short_id)}`);
    } else if (tls.server_name) {
        parts.push(`tls-name=${cleanValue(tls.server_name)}`);
    }
}

function formatProxyLine(tag, parts) {
    return `${cleanValue(tag)} = ${parts.join(', ')}`;
}

function formatVmessSecurity(security) {
    const normalized = cleanValue(security || 'auto').toLowerCase();
    return normalized === 'chacha20-poly1305' ? 'chacha20-ietf-poly1305' : normalized;
}

export class LoonConfigBuilder extends SurgeConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry, includeAutoSelect = true) {
        super(
            inputString,
            selectedRules,
            customRules,
            baseConfig ?? LOON_CONFIG,
            lang,
            userAgent,
            groupByCountry,
            includeAutoSelect
        );
    }

    addSelectors() {
        if (this.getValidProxies().length === 0) {
            throw new InvalidPayloadError('No Loon-compatible proxies found');
        }
        super.addSelectors();
    }

    convertProxy(proxy) {
        const unsupported = () => `# ${cleanValue(proxy.tag)} - Unsupported by Loon: ${cleanValue(proxy.type)}`;
        let parts;

        switch (proxy.type) {
            case 'shadowsocks': {
                if (proxy.plugin && proxy.plugin !== 'obfs') return unsupported();
                parts = [
                    'Shadowsocks',
                    cleanValue(proxy.server),
                    proxy.server_port,
                    cleanValue(proxy.method),
                    quoteValue(proxy.password)
                ];
                if (proxy.plugin === 'obfs') {
                    const options = proxy.plugin_opts || {};
                    if (options.mode) parts.push(`obfs-name=${cleanValue(options.mode)}`);
                    if (options.host) parts.push(`obfs-host=${cleanValue(options.host)}`);
                    if (options.path) parts.push(`obfs-uri=${cleanValue(options.path)}`);
                }
                if (proxy.tcp_fast_open) parts.push('fast-open=true');
                if (proxy.udp) parts.push('udp=true');
                return formatProxyLine(proxy.tag, parts);
            }
            case 'vmess':
                parts = [
                    'vmess',
                    cleanValue(proxy.server),
                    proxy.server_port,
                    formatVmessSecurity(proxy.security),
                    quoteValue(proxy.uuid)
                ];
                if (!appendTransport(parts, proxy.transport)) return unsupported();
                appendTls(parts, proxy.tls, { includeOverTls: true });
                parts.push(`alterId=${proxy.alter_id || 0}`);
                if (proxy.tcp_fast_open) parts.push('fast-open=true');
                if (proxy.udp) parts.push('udp=true');
                return formatProxyLine(proxy.tag, parts);
            case 'vless':
                parts = [
                    'vless',
                    cleanValue(proxy.server),
                    proxy.server_port,
                    quoteValue(proxy.uuid)
                ];
                if (!appendTransport(parts, proxy.transport)) return unsupported();
                appendTls(parts, proxy.tls, { includeOverTls: true });
                if (proxy.flow) parts.push(`flow=${cleanValue(proxy.flow)}`);
                if (proxy.tcp_fast_open) parts.push('fast-open=true');
                if (proxy.udp) parts.push('udp=true');
                return formatProxyLine(proxy.tag, parts);
            case 'trojan':
                parts = [
                    'trojan',
                    cleanValue(proxy.server),
                    proxy.server_port,
                    quoteValue(proxy.password)
                ];
                if (proxy.transport && !appendTransport(parts, proxy.transport)) return unsupported();
                appendTls(parts, proxy.tls);
                if (proxy.tcp_fast_open) parts.push('fast-open=true');
                if (proxy.udp) parts.push('udp=true');
                return formatProxyLine(proxy.tag, parts);
            case 'hysteria2':
                parts = [
                    'Hysteria2',
                    cleanValue(proxy.server),
                    proxy.server_port,
                    quoteValue(proxy.password)
                ];
                if (proxy.ports) parts.push(`server-ports=${quoteValue(proxy.ports)}`);
                if (proxy.hop_interval !== undefined) parts.push(`hop-interval=${proxy.hop_interval}`);
                appendTls(parts, proxy.tls);
                if (proxy.obfs?.type === 'salamander' && proxy.obfs.password) {
                    parts.push(`salamander-password=${quoteValue(proxy.obfs.password)}`);
                }
                if (proxy.fast_open) parts.push('fast-open=true');
                parts.push('udp=true');
                if (proxy.down !== undefined) {
                    const bandwidth = `${proxy.down}`.match(/\d+/)?.[0];
                    if (bandwidth) parts.push(`download-bandwidth=${bandwidth}`);
                }
                return formatProxyLine(proxy.tag, parts);
            case 'anytls':
                parts = [
                    'anytls',
                    cleanValue(proxy.server),
                    proxy.server_port,
                    quoteValue(proxy.password)
                ];
                if (Number.isInteger(proxy['idle-session-timeout'])) {
                    parts.push(`idle-session-timeout=${proxy['idle-session-timeout']}`);
                }
                appendTls(parts, proxy.tls);
                if (proxy.udp) parts.push('udp=true');
                return formatProxyLine(proxy.tag, parts);
            default:
                return unsupported();
        }
    }

    formatConfig() {
        const rules = generateRules(this.selectedRules, this.customRules);
        const output = ['[General]'];

        Object.entries(this.config.general || {}).forEach(([key, value]) => {
            output.push(`${key} = ${value}`);
        });

        output.push('', '[Proxy]');
        output.push(...(this.config.proxies || []));

        output.push('', '[Proxy Group]');
        output.push(...(this.config['proxy-groups'] || []).map(group => {
            if (typeof group === 'string') return group;
            return this.convertObjectGroupToSurgeString(group);
        }).filter(Boolean));

        const remoteRules = [];
        rules.forEach(rule => {
            const policy = this.t(`outboundNames.${rule.outbound}`);
            (rule.site_rules || []).filter(Boolean).forEach(site => {
                remoteRules.push(`${SURGE_SITE_RULE_SET_BASEURL}${site}.conf, ${policy}`);
            });
            (rule.ip_rules || []).filter(Boolean).forEach(ip => {
                remoteRules.push(`${SURGE_IP_RULE_SET_BASEURL}${ip}.txt, ${policy}`);
            });
        });
        if (remoteRules.length > 0) {
            output.push('', '[Remote Rule]', ...remoteRules);
        }

        output.push('', '[Rule]');
        rules.forEach(rule => {
            const policy = this.t(`outboundNames.${rule.outbound}`);
            (rule.src_ip_cidr || []).filter(Boolean).forEach(cidr => {
                output.push(`# SRC-IP-CIDR not supported by Loon, skipped: ${cleanValue(cidr)}`);
            });
            (rule.domain_suffix || []).filter(Boolean).forEach(suffix => {
                output.push(`DOMAIN-SUFFIX,${suffix},${policy}`);
            });
            (rule.domain_keyword || []).filter(Boolean).forEach(keyword => {
                output.push(`DOMAIN-KEYWORD,${keyword},${policy}`);
            });
            (rule.ip_cidr || []).filter(Boolean).forEach(cidr => {
                const type = `${cidr}`.includes(':') ? 'IP-CIDR6' : 'IP-CIDR';
                output.push(`${type},${cidr},${policy},no-resolve`);
            });
        });
        output.push(`FINAL,${this.t('outboundNames.Fall Back')}`);

        return output.join('\n');
    }
}
