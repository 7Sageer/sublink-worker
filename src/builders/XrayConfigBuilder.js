import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { generateRules } from '../config/index.js';

const RESERVED_OUTBOUND_TAGS = new Set(['DIRECT', 'REJECT']);
const RESERVED_OUTBOUND_PROTOCOLS = new Set(['freedom', 'blackhole']);

export class XrayConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry = false) {
        const defaultBase = {
            log: { loglevel: 'warning' },
            outbounds: [
                { protocol: 'freedom', tag: 'DIRECT' },
                { protocol: 'blackhole', tag: 'REJECT' }
            ],
            routing: { rules: [] }
        };
        super(inputString, baseConfig || defaultBase, lang, userAgent, groupByCountry);
        this.selectedRules = selectedRules;
        this.customRules = customRules;
    }

    getProxies() {
        return (this.config.outbounds || []).filter(o => {
            const tag = typeof o?.tag === 'string' ? o.tag : '';
            if (!tag) return false;
            if (RESERVED_OUTBOUND_TAGS.has(tag)) return false;
            if (RESERVED_OUTBOUND_PROTOCOLS.has(o?.protocol)) return false;
            return true;
        });
    }

    getProxyName(proxy) {
        return proxy.tag;
    }

    addAutoSelectGroup() { }
    addNodeSelectGroup() { }
    addOutboundGroups() { }
    addCustomRuleGroups() { }
    addFallBackGroup() { }
    addCountryGroups() { }

    convertProxy(proxy) {
        const tag = proxy?.tag;
        const server = proxy?.server;
        const port = proxy?.server_port;
        if (!tag || !server || !port) return null;

        switch (proxy.type) {
            case 'vless':
                return this.convertVless(proxy);
            case 'vmess':
                return this.convertVmess(proxy);
            case 'trojan':
                return this.convertTrojan(proxy);
            case 'shadowsocks':
                return this.convertShadowsocks(proxy);
            default:
                // Skip unsupported proxy types for Xray output (e.g. hysteria2/tuic/anytls/http)
                return null;
        }
    }

    convertVless(proxy) {
        if (!proxy.uuid) return null;
        return {
            tag: proxy.tag,
            protocol: 'vless',
            settings: {
                vnext: [
                    {
                        address: proxy.server,
                        port: proxy.server_port,
                        users: [
                            {
                                id: proxy.uuid,
                                encryption: 'none',
                                ...(proxy.flow ? { flow: proxy.flow } : {})
                            }
                        ]
                    }
                ]
            },
            streamSettings: buildStreamSettings(proxy)
        };
    }

    convertVmess(proxy) {
        if (!proxy.uuid) return null;
        return {
            tag: proxy.tag,
            protocol: 'vmess',
            settings: {
                vnext: [
                    {
                        address: proxy.server,
                        port: proxy.server_port,
                        users: [
                            {
                                id: proxy.uuid,
                                alterId: proxy.alter_id ?? 0,
                                security: proxy.security ?? 'auto'
                            }
                        ]
                    }
                ]
            },
            streamSettings: buildStreamSettings(proxy)
        };
    }

    convertTrojan(proxy) {
        if (!proxy.password) return null;
        return {
            tag: proxy.tag,
            protocol: 'trojan',
            settings: {
                servers: [
                    {
                        address: proxy.server,
                        port: proxy.server_port,
                        password: proxy.password,
                        ...(proxy.flow ? { flow: proxy.flow } : {})
                    }
                ]
            },
            streamSettings: buildStreamSettings(proxy)
        };
    }

    convertShadowsocks(proxy) {
        if (!proxy.password || !proxy.method) return null;
        return {
            tag: proxy.tag,
            protocol: 'shadowsocks',
            settings: {
                servers: [
                    {
                        address: proxy.server,
                        port: proxy.server_port,
                        method: proxy.method,
                        password: proxy.password
                    }
                ]
            }
        };
    }

    addProxyToConfig(outbound) {
        if (!outbound) return;
        this.config.outbounds = this.config.outbounds || [];

        const existingTags = new Set(this.config.outbounds.map(o => o.tag).filter(Boolean));
        let finalTag = outbound.tag;
        let counter = 2;
        while (existingTags.has(finalTag)) {
            finalTag = `${outbound.tag} ${counter++}`;
        }
        outbound.tag = finalTag;
        this.config.outbounds.push(outbound);
    }

    formatConfig() {
        const cfg = this.config;
        cfg.routing = cfg.routing || {};
        cfg.routing.rules = cfg.routing.rules || [];

        const outbounds = this.getProxies();
        const allTags = outbounds.map(o => o.tag).filter(Boolean);
        const outboundTag = allTags[0] || 'DIRECT';

        // Generate routing rules based on selected/custom rules
        const rules = generateRules(this.selectedRules, this.customRules);

        const routeTarget = { outboundTag };

        const routingRules = [];

        // Prefer direct for CN by default
        routingRules.push({ type: 'field', ip: ['geoip:cn'], outboundTag: 'DIRECT' });
        routingRules.push({ type: 'field', domain: ['geosite:cn'], outboundTag: 'DIRECT' });

        rules.filter(r =>
            Array.isArray(r.domain_suffix) ||
            Array.isArray(r.domain_keyword) ||
            (Array.isArray(r.site_rules) && r.site_rules[0] !== '')
        ).forEach(r => {
            const domain = [];
            (r.domain_suffix || []).forEach(s => domain.push(`domain:${s}`));
            (r.domain_keyword || []).forEach(s => domain.push(`keyword:${s}`));
            (r.site_rules || []).forEach(s => { if (s) domain.push(`geosite:${s}`); });
            if (domain.length > 0) routingRules.push({ type: 'field', domain, ...routeTarget });
        });

        rules.filter(r => Array.isArray(r.ip_rules) && r.ip_rules[0] !== '').forEach(r => {
            const ip = r.ip_rules.map(ipr => `geoip:${ipr}`);
            routingRules.push({ type: 'field', ip, ...routeTarget });
        });

        rules.filter(r => Array.isArray(r.ip_cidr)).forEach(r => {
            const ip = r.ip_cidr;
            routingRules.push({ type: 'field', ip, ...routeTarget });
        });

        // Final catch-all
        routingRules.push({ type: 'field', ...routeTarget });

        cfg.routing.rules = [...cfg.routing.rules, ...routingRules];
        return cfg;
    }
}

function buildStreamSettings(proxy) {
    const transport = proxy.transport;
    const tls = proxy.tls;

    const network = transport?.type || proxy.network || 'tcp';
    const streamSettings = { network };

    if (tls?.enabled) {
        if (tls.reality?.enabled || tls.reality) {
            streamSettings.security = 'reality';
            streamSettings.realitySettings = {
                publicKey: tls.reality.public_key ?? tls.reality.publicKey,
                shortId: tls.reality.short_id ?? tls.reality.shortId,
                serverName: tls.server_name || tls.sni,
                ...(tls.utls?.fingerprint ? { fingerprint: tls.utls.fingerprint } : {}),
            };
        } else {
            streamSettings.security = 'tls';
            streamSettings.tlsSettings = {
                serverName: tls.server_name || tls.sni,
                allowInsecure: !!tls.insecure,
                ...(Array.isArray(tls.alpn) ? { alpn: tls.alpn } : {}),
                ...(tls.utls?.fingerprint ? { fingerprint: tls.utls.fingerprint } : {}),
            };
        }
    }

    if (network === 'ws') {
        streamSettings.wsSettings = {
            path: transport?.path,
            headers: transport?.headers
        };
    } else if (network === 'grpc') {
        streamSettings.grpcSettings = {
            serviceName: transport?.service_name
        };
    } else if (network === 'http') {
        streamSettings.httpSettings = {
            host: transport?.headers?.host ? [transport.headers.host] : undefined,
            path: Array.isArray(transport?.path) ? transport.path : (transport?.path ? [transport.path] : undefined),
            method: transport?.method
        };
    } else if (network === 'h2') {
        streamSettings.httpSettings = {
            host: Array.isArray(transport?.host) ? transport.host : (transport?.host ? [transport.host] : undefined),
            path: transport?.path ? [transport.path] : undefined
        };
    }

    return streamSettings;
}

