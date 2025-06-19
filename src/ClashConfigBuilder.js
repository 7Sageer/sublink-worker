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
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    } : undefined
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
                    'skip-cert-verify': proxy.tls.insecure,
                    'flow': proxy.flow ?? undefined,
                };
            case 'hysteria2':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    obfs: proxy.obfs.type,
                    'obfs-password': proxy.obfs.password,
                    password: proxy.password,
                    auth: proxy.auth,
                    up: proxy.up_mbps,
                    down: proxy.down_mbps,
                    'recv-window-conn': proxy.recv_window_conn,
                    sni: proxy.tls?.server_name || '',
                    'skip-cert-verify': proxy.tls?.insecure || true,
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
                    'skip-cert-verify': proxy.tls.insecure,
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
                    'congestion-controller': proxy.congestion,
                    'skip-cert-verify': proxy.tls.insecure,
                    'disable-sni': true,
                    'alpn': proxy.tls.alpn,
                    'sni': proxy.tls.server_name,
                    'udp-relay-mode': 'native',
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

    // 生成规则
    _generateRules() { // Renamed to avoid conflict if BaseConfigBuilder has generateRules
        return generateRules(this.selectedRules, this.customRules);
    }

    _buildProxyGroups() {
        const actualProxyNames = (this.config.proxies || []).map(p => p.name);
        const newProxyGroups = [];

        const unifiedRuleObjects = this._generateRules(); // Get rules generated by config.js
        const unifiedRuleOutboundNames = getOutbounds(this.selectedRules); // Get selected rule names like 'Google', 'Ad Block'

        // 1. Global Direct Group
        newProxyGroups.push({
            name: t('outboundNames.Global Direct'),
            type: 'select',
            proxies: ['DIRECT']
        });

        // 2. Global Block Group
        newProxyGroups.push({
            name: t('outboundNames.Global Block'),
            type: 'select',
            proxies: ['REJECT', 'DIRECT']
        });

        // 3. Auto Select Group
        newProxyGroups.push({
            name: t('outboundNames.Auto Select'),
            type: 'url-test',
            proxies: DeepCopy(actualProxyNames),
            url: 'http://www.gstatic.com/generate_204',
            interval: 300,
            lazy: false // Explicitly set lazy to false as per common Clash configurations
        });

        // 4. Node Select Group
        newProxyGroups.push({
            name: t('outboundNames.Node Select'),
            type: 'select',
            proxies: [
                t('outboundNames.Auto Select'),
                t('outboundNames.Global Direct'),
                ...actualProxyNames
            ]
        });

        // 5. Lazy Config Group
        newProxyGroups.push({
            name: t('outboundNames.Lazy Config'),
            type: 'fallback', // Fallback type for lazy loading behavior
            proxies: [
                t('outboundNames.Node Select'),
                t('outboundNames.Auto Select'),
                t('outboundNames.Global Direct'),
                ...actualProxyNames // Include actual proxies for broader fallback
            ],
            url: 'http://www.gstatic.com/generate_204',
            interval: 300
        });

        // 6. Uncaught Fish Group (replaces Fall Back)
        newProxyGroups.push({
            name: t('outboundNames.Uncaught Fish'),
            type: 'select',
            proxies: [
                t('outboundNames.Lazy Config'),
                t('outboundNames.Node Select'),
                t('outboundNames.Global Direct'),
                t('outboundNames.Auto Select')
            ]
        });

        // 7. Service-specific groups from UNIFIED_RULES
        // We need the full rule objects to check rule.name for 'Ad Block'
        // generateRules returns an array of objects like { name: 'Ad Block', site_rules: [...], ... }
        // The `outbounds` from getOutbounds(this.selectedRules) is just a list of names.
        // We should iterate unifiedRuleObjects which contains the full rule details.

        const serviceRuleNames = new Set();

        unifiedRuleObjects.forEach(rule => {
            const groupName = t(`outboundNames.${rule.outbound}`); // rule.outbound is the 'name' like 'Google'
            serviceRuleNames.add(groupName); // Keep track of names for ordering if needed later

            let groupProxies;
            if (rule.outbound === 'Ad Block') {
                groupProxies = [
                    t('outboundNames.Global Block'),
                    // t('outboundNames.Global Direct'), // Ad Block should primarily block. Direct is a fallback for Global Block.
                    // t('outboundNames.Node Select') // Not typical for Ad Block group
                ];
            } else {
                groupProxies = [
                    t('outboundNames.Lazy Config'),
                    t('outboundNames.Node Select'),
                    // t('outboundNames.Auto Select'), // Lazy Config already includes Auto Select
                    // t('outboundNames.Global Direct'), // Lazy Config includes Global Direct
                    ...actualProxyNames // Offer direct selection of any node too
                ];
            }
            newProxyGroups.push({
                name: groupName,
                type: 'select',
                proxies: groupProxies
            });
        });

        // 8. All groups from customRules
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                const customGroupName = t(`outboundNames.${rule.name}`); // Assuming custom rule names are used as keys
                // Add if not already added by unified rules (e.g. if a custom rule has the same name)
                if (!serviceRuleNames.has(customGroupName)) {
                    newProxyGroups.push({
                        name: customGroupName,
                        type: 'select',
                        proxies: [ // Standard proxies for custom groups
                            t('outboundNames.Lazy Config'),
                            t('outboundNames.Node Select'),
                            ...actualProxyNames
                        ]
                    });
                }
            });
        }

        // Deduplicate proxy groups by name, keeping the first occurrence (respecting the order)
        const finalProxyGroups = [];
        const seenNames = new Set();
        for (const group of newProxyGroups) {
            if (!seenNames.has(group.name)) {
                finalProxyGroups.push(group);
                seenNames.add(group.name);
            }
        }

        this.config['proxy-groups'] = finalProxyGroups;
    }


    formatConfig() {
        // Ensure proxies are initialized
        this.config.proxies = this.config.proxies || [];

        // Rebuild proxy-groups from scratch
        this._buildProxyGroups();

        const rulesFromConfigJs = this._generateRules(); // Use the renamed version
        const ruleResults = [];
        
        const { site_rule_providers, ip_rule_providers } = generateClashRuleSets(this.selectedRules, this.customRules);
        
        this.config['rule-providers'] = {
            ...site_rule_providers,
            ...ip_rule_providers
        };

        rulesFromConfigJs.forEach(rule => {
            const targetGroup = (rule.outbound === 'Ad Block')
                ? t('outboundNames.Global Block')
                : t(`outboundNames.${rule.outbound}`);

            if (rule.domain_suffix && rule.domain_suffix.length > 0) {
                rule.domain_suffix.forEach(suffix => {
                    if (suffix) ruleResults.push(`DOMAIN-SUFFIX,${suffix},${targetGroup}`);
                });
            }
            if (rule.domain_keyword && rule.domain_keyword.length > 0) {
                rule.domain_keyword.forEach(keyword => {
                    if (keyword) ruleResults.push(`DOMAIN-KEYWORD,${keyword},${targetGroup}`);
                });
            }
            if (rule.site_rules && rule.site_rules.length > 0 && rule.site_rules[0] !== '') {
                 rule.site_rules.forEach(site => {
                    if (site) ruleResults.push(`RULE-SET,${site},${targetGroup}`);
                });
            }
            if (rule.ip_rules && rule.ip_rules.length > 0 && rule.ip_rules[0] !== '') {
                rule.ip_rules.forEach(ip => {
                    if (ip) ruleResults.push(`RULE-SET,${ip},${targetGroup},no-resolve`);
                });
            }
            if (rule.ip_cidr && rule.ip_cidr.length > 0) {
                 rule.ip_cidr.forEach(cidr => {
                    if (cidr) ruleResults.push(`IP-CIDR,${cidr},${targetGroup},no-resolve`);
                });
            }
        });

        this.config.rules = ruleResults;
        // The final MATCH rule should point to Uncaught Fish
        this.config.rules.push(`MATCH,${t('outboundNames.Uncaught Fish')}`);

        return yaml.dump(this.config);
    }
}
