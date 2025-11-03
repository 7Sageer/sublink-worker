import yaml from 'js-yaml';
import { CLASH_CONFIG, generateRules, generateClashRuleSets, getOutbounds, PREDEFINED_RULE_SETS } from './config.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { DeepCopy } from './utils.js';
import { t } from './i18n/index.js';

export class ClashConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent) {
        if (!baseConfig) {
            baseConfig = CLASH_CONFIG;
        }
        super(inputString, baseConfig, lang, userAgent);
        this.selectedRules = selectedRules;
        this.customRules = customRules;
    }

    getProxies() {
        return this.config.proxies || [];
    }

    getProxyName(proxy) {
        return proxy.name;
    }

    convertProxy(proxy) {
        switch(proxy.type) {
            case 'shadowsocks':
                return {
                    name: proxy.tag,
                    type: 'ss',
                    server: proxy.server,
                    port: proxy.server_port,
                    cipher: proxy.method,
                    password: proxy.password
                };
            case 'vmess':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    uuid: proxy.uuid,
                    alterId: proxy.alter_id,
                    cipher: proxy.security,
                    tls: proxy.tls?.enabled || false,
                    servername: proxy.tls?.server_name || '',
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    network: proxy.transport?.type || proxy.network || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws'
                        ? {
                            path: proxy.transport.path,
                            headers: proxy.transport.headers
                        }
                        : undefined,
                    'http-opts': proxy.transport?.type === 'http'
                        ? (() => {
                            const opts = {
                                method: proxy.transport.method || 'GET',
                                path: Array.isArray(proxy.transport.path) ? proxy.transport.path : [proxy.transport.path || '/'],
                            };
                            if (proxy.transport.headers && Object.keys(proxy.transport.headers).length > 0) {
                                opts.headers = proxy.transport.headers;
                            }
                            return opts;
                        })()
                        : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc'
                        ? {
                            'grpc-service-name': proxy.transport.service_name
                        }
                        : undefined,
                    'h2-opts': proxy.transport?.type === 'h2'
                        ? {
                            path: proxy.transport.path,
                            host: proxy.transport.host
                        }
                        : undefined
                };
            case 'vless':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    uuid: proxy.uuid,
                    cipher: proxy.security,
                    tls: proxy.tls?.enabled || false,
                    'client-fingerprint': proxy.tls.utls?.fingerprint,
                    servername: proxy.tls?.server_name || '',
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    }: undefined,
                    'reality-opts': proxy.tls.reality?.enabled ? {
                        'public-key': proxy.tls.reality.public_key,
                        'short-id': proxy.tls.reality.short_id,
                    } : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc' ? {
                        'grpc-service-name': proxy.transport.service_name,
                    } : undefined,
                    tfo : proxy.tcp_fast_open,
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(typeof proxy.udp !== 'undefined' ? { udp: proxy.udp } : {}),
                    ...(proxy.alpn ? { alpn: proxy.alpn } : {}),
                    ...(proxy.packet_encoding ? { 'packet-encoding': proxy.packet_encoding } : {}),
                    'flow': proxy.flow ?? undefined,
                };
            case 'hysteria2':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    ...(proxy.ports ? { ports: proxy.ports } : {}),
                    obfs: proxy.obfs?.type,
                    'obfs-password': proxy.obfs?.password,
                    password: proxy.password,
                    auth: proxy.auth,
                    up: proxy.up,
                    down: proxy.down,
                    'recv-window-conn': proxy.recv_window_conn,
                    sni: proxy.tls?.server_name || '',
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(proxy.hop_interval !== undefined ? { 'hop-interval': proxy.hop_interval } : {}),
                    ...(proxy.alpn ? { alpn: proxy.alpn } : {}),
                    ...(proxy.fast_open !== undefined ? { 'fast-open': proxy.fast_open } : {}),
                };
            case 'trojan':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    password: proxy.password,
                    cipher: proxy.security,
                    tls: proxy.tls?.enabled || false,
                    'client-fingerprint': proxy.tls.utls?.fingerprint,
                    sni: proxy.tls?.server_name || '',
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    }: undefined,
                    'reality-opts': proxy.tls.reality?.enabled ? {
                        'public-key': proxy.tls.reality.public_key,
                        'short-id': proxy.tls.reality.short_id,
                    } : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc' ? {
                        'grpc-service-name': proxy.transport.service_name,
                    } : undefined,
                    tfo : proxy.tcp_fast_open,
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(proxy.alpn ? { alpn: proxy.alpn } : {}),
                    'flow': proxy.flow ?? undefined,
                };
            case 'tuic':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    uuid: proxy.uuid,
                    password: proxy.password,
                    'congestion-controller': proxy.congestion_control,
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(proxy.disable_sni !== undefined ? { 'disable-sni': proxy.disable_sni } : {}),
                    ...(proxy.tls?.alpn ? { alpn: proxy.tls.alpn } : {}),
                    'sni': proxy.tls?.server_name,
                    'udp-relay-mode': proxy.udp_relay_mode || 'native',
                    ...(proxy.zero_rtt !== undefined ? { 'zero-rtt': proxy.zero_rtt } : {}),
                    ...(proxy.reduce_rtt !== undefined ? { 'reduce-rtt': proxy.reduce_rtt } : {}),
                    ...(proxy.fast_open !== undefined ? { 'fast-open': proxy.fast_open } : {}),
                };
            default:
                return proxy; // Return as-is if no specific conversion is defined
        }
    }

    addProxyToConfig(proxy) {
        this.config.proxies = this.config.proxies || [];

        // Find proxies with the same or partially matching name
        const similarProxies = this.config.proxies.filter(p => p.name.includes(proxy.name));
    
        // Check if there is a proxy with identical data excluding the 'name' field
        const isIdentical = similarProxies.some(p => {
            const { name: _, ...restOfProxy } = proxy; // Exclude the 'name' attribute
            const { name: __, ...restOfP } = p;       // Exclude the 'name' attribute
            return JSON.stringify(restOfProxy) === JSON.stringify(restOfP);
        });
    
        if (isIdentical) {
            // If there is a proxy with identical data, skip adding it
            return;
        }
    
        // If there are proxies with similar names but different data, modify the name
        if (similarProxies.length > 0) {
            proxy.name = `${proxy.name} ${similarProxies.length + 1}`;
        }
    
        // Add the proxy to the configuration
        this.config.proxies.push(proxy);
    }

    addAutoSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        this.config['proxy-groups'].push({
            name: t('outboundNames.Auto Select'),
            type: 'url-test',
            proxies: DeepCopy(proxyList),
            url: 'https://www.gstatic.com/generate_204',
            interval: 300,
            lazy: false
        });
    }

    addNodeSelectGroup(proxyList) {
        proxyList.unshift('DIRECT', 'REJECT', t('outboundNames.Auto Select'));
        this.config['proxy-groups'].unshift({
            type: "select",
            name: t('outboundNames.Node Select'),
            proxies: proxyList
        });
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound !== t('outboundNames.Node Select')) {
                this.config['proxy-groups'].push({
                    type: "select",
                    name: t(`outboundNames.${outbound}`),
                    proxies: [t('outboundNames.Node Select'), ...proxyList]
                });
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                this.config['proxy-groups'].push({
                    type: "select",
                    name: t(`outboundNames.${rule.name}`),
                    proxies: [t('outboundNames.Node Select'), ...proxyList]
                });
            });
        }
    }

    addFallBackGroup(proxyList) {
        this.config['proxy-groups'].push({
            type: "select",
            name: t('outboundNames.Fall Back'),
            proxies: [t('outboundNames.Node Select'), ...proxyList]
        });
    }

    // 生成规则
    generateRules() {
        return generateRules(this.selectedRules, this.customRules);
    }

    formatConfig() {
        // If remote YAML provided proxy-groups, sanitize their proxy lists to
        // remove entries that don't exist as proxies or groups (e.g., unsupported types like anytls).
        const rules = this.generateRules();
        const ruleResults = [];

        const { site_rule_providers, ip_rule_providers } = generateClashRuleSets(this.selectedRules, this.customRules);
        this.config['rule-providers'] = {
            ...site_rule_providers,
            ...ip_rule_providers
        };

        rules.filter(rule => !!rule.domain_suffix || !!rule.domain_keyword).map(rule => {
            rule.domain_suffix.forEach(suffix => {
                ruleResults.push(`DOMAIN-SUFFIX,${suffix},${t('outboundNames.'+ rule.outbound)}`);
            });
            rule.domain_keyword.forEach(keyword => {
                ruleResults.push(`DOMAIN-KEYWORD,${keyword},${t('outboundNames.'+ rule.outbound)}`);
            });
        });

        rules.filter(rule => !!rule.site_rules[0]).map(rule => {
            rule.site_rules.forEach(site => {
                ruleResults.push(`RULE-SET,${site},${t('outboundNames.'+ rule.outbound)}`);
            });
        });

        rules.filter(rule => !!rule.ip_rules[0]).map(rule => {
            rule.ip_rules.forEach(ip => {
                ruleResults.push(`RULE-SET,${ip},${t('outboundNames.'+ rule.outbound)},no-resolve`);
            });
        });

        rules.filter(rule => !!rule.ip_cidr).map(rule => {
            rule.ip_cidr.forEach(cidr => {
                ruleResults.push(`IP-CIDR,${cidr},${t('outboundNames.'+ rule.outbound)},no-resolve`);
            });
        });

        this.config.rules = [...ruleResults];
        this.config.rules.push(`MATCH,${t('outboundNames.Fall Back')}`);

        return yaml.dump(this.config);
    }
}
