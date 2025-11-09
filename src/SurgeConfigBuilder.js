import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { parseCountryFromNodeName } from './utils.js';
import { SURGE_CONFIG, SURGE_SITE_RULE_SET_BASEURL, SURGE_IP_RULE_SET_BASEURL, generateRules, getOutbounds, PREDEFINED_RULE_SETS } from './config.js';
import { t } from './i18n/index.js';

export class SurgeConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry) {
        // Not yet implemented, set aside for later use ;)
        // if (!baseConfig) {
        //     baseConfig = SURGE_CONFIG;
        // }
        baseConfig = SURGE_CONFIG;
        super(inputString, baseConfig, lang, userAgent, groupByCountry);
        this.selectedRules = selectedRules;
        this.customRules = customRules;
        this.subscriptionUrl = null;
        this.countryGroupNames = [];
        this.manualGroupName = null;
    }

    setSubscriptionUrl(url) {
        this.subscriptionUrl = url;
        return this;
    }

    getProxies() {
        return this.config.proxies || [];
    }

    getProxyName(proxy) {
        return proxy.split('=')[0].trim();
    }

    convertProxy(proxy) {
        let surgeProxy;
        switch (proxy.type) {
            case 'shadowsocks':
                surgeProxy = `${proxy.tag} = ss, ${proxy.server}, ${proxy.server_port}, encrypt-method=${proxy.method}, password=${proxy.password}`;
                break;
            case 'vmess':
                surgeProxy = `${proxy.tag} = vmess, ${proxy.server}, ${proxy.server_port}, username=${proxy.uuid}`;
                if (proxy.alter_id == 0) {
                    surgeProxy += ', vmess-aead=true';
                }
                if (proxy.tls?.enabled) {
                    surgeProxy += ', tls=true';
                    if (proxy.tls.server_name) {
                        surgeProxy += `, sni=${proxy.tls.server_name}`;
                    }
                    if (proxy.tls.insecure) {
                        surgeProxy += ', skip-cert-verify=true';
                    }
                    if (proxy.tls.alpn) {
                        surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                    }
                }
                if (proxy.transport?.type === 'ws') {
                    surgeProxy += `, ws=true, ws-path=${proxy.transport.path}`;
                    if (proxy.transport.headers) {
                        surgeProxy += `, ws-headers=Host:${proxy.transport.headers.Host}`;
                    }
                } else if (proxy.transport?.type === 'grpc') {
                    surgeProxy += `, grpc-service-name=${proxy.transport.service_name}`;
                }
                break;
            case 'trojan':
                surgeProxy = `${proxy.tag} = trojan, ${proxy.server}, ${proxy.server_port}, password=${proxy.password}`;
                if (proxy.tls?.server_name) {
                    surgeProxy += `, sni=${proxy.tls.server_name}`;
                }
                if (proxy.tls?.insecure) {
                    surgeProxy += ', skip-cert-verify=true';
                }
                if (proxy.tls?.alpn) {
                    surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                }
                if (proxy.transport?.type === 'ws') {
                    surgeProxy += `, ws=true, ws-path=${proxy.transport.path}`;
                    if (proxy.transport.headers) {
                        surgeProxy += `, ws-headers=Host:${proxy.transport.headers.Host}`;
                    }
                } else if (proxy.transport?.type === 'grpc') {
                    surgeProxy += `, grpc-service-name=${proxy.transport.service_name}`;
                }
                break;
            case 'hysteria2':
                surgeProxy = `${proxy.tag} = hysteria2, ${proxy.server}, ${proxy.server_port}, password=${proxy.password}`;
                if (proxy.tls?.server_name) {
                    surgeProxy += `, sni=${proxy.tls.server_name}`;
                }
                if (proxy.tls?.insecure) {
                    surgeProxy += ', skip-cert-verify=true';
                }
                if (proxy.tls?.alpn) {
                    surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                }
                break;
            case 'tuic':
                surgeProxy = `${proxy.tag} = tuic, ${proxy.server}, ${proxy.server_port}, password=${proxy.password}, uuid=${proxy.uuid}`;
                if (proxy.tls?.server_name) {
                    surgeProxy += `, sni=${proxy.tls.server_name}`;
                }
                if (proxy.tls?.alpn) {
                    surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                }
                if (proxy.tls?.insecure) {
                    surgeProxy += ', skip-cert-verify=true';
                }
                if (proxy.congestion_control) {
                    surgeProxy += `, congestion-controller=${proxy.congestion_control}`;
                }
                if (proxy.udp_relay_mode) {
                    surgeProxy += `, udp-relay-mode=${proxy.udp_relay_mode}`;
                }
                break;
            default:
                surgeProxy = `# ${proxy.tag} - Unsupported proxy type: ${proxy.type}`;
        }
        return surgeProxy;
    }

    addProxyToConfig(proxy) {
        this.config.proxies = this.config.proxies || [];
        
        // Get the name of the proxy to be added
        const proxyName = this.getProxyName(proxy);
        
        // Check if there are proxies with similar names in existing proxies
        const similarProxies = this.config.proxies
            .map(p => this.getProxyName(p))
            .filter(name => name.includes(proxyName));
            
        // Check if there is a proxy with identical configuration
        const isIdentical = this.config.proxies.some(p => 
            // Compare the remaining configuration after removing the name part
            p.substring(p.indexOf('=')) === proxy.substring(proxy.indexOf('='))
        );
        
        if (isIdentical) {
            // If there is a proxy with identical configuration, skip adding it
            return;
        }
        
        // If there are proxies with similar names but different configurations, modify the name
        if (similarProxies.length > 0) {
            // Get the position of the equals sign
            const equalsPos = proxy.indexOf('=');
            if (equalsPos > 0) {
                // Create a new proxy string with a number appended to the name
                proxy = `${proxyName} ${similarProxies.length + 1}${proxy.substring(equalsPos)}`;
            }
        }
        
        this.config.proxies.push(proxy);
    }

    createProxyGroup(name, type, options = [], extraConfig = '') {
        const sanitized = this.sanitizeOptions(options);
        const optionsPart = sanitized.length > 0 ? `, ${sanitized.join(', ')}` : '';
        return `${name} = ${type}${optionsPart}${extraConfig}`;
    }

    sanitizeOptions(options = []) {
        const normalize = (s) => typeof s === 'string' ? s.trim() : s;
        const seen = new Set();
        return options
            .map(normalize)
            .filter(option => typeof option === 'string' && option.length > 0)
            .filter(option => {
                if (seen.has(option)) return false;
                seen.add(option);
                return true;
            });
    }

    buildNodeSelectOptions(proxyList = []) {
        return this.withDirectReject([
            t('outboundNames.Auto Select'),
            ...proxyList
        ]);
    }

    buildAggregatedOptions(proxyList = []) {
        const base = this.groupByCountry
            ? [
                t('outboundNames.Node Select'),
                t('outboundNames.Auto Select'),
                ...(this.manualGroupName ? [this.manualGroupName] : []),
                ...((this.countryGroupNames || []))
              ]
            : [
                t('outboundNames.Node Select'),
                ...proxyList
              ];
        return this.withDirectReject(base);
    }

    withDirectReject(options = []) {
        return this.sanitizeOptions([
            'DIRECT',
            'REJECT',
            ...options
        ]);
    }

    addAutoSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        this.config['proxy-groups'].push(
            this.createProxyGroup(
                t('outboundNames.Auto Select'),
                'url-test',
                this.sanitizeOptions(proxyList),
                ', url=http://www.gstatic.com/generate_204, interval=300'
            )
        );
    }

    addNodeSelectGroup(proxyList) {
        const options = this.buildNodeSelectOptions(proxyList);
        this.config['proxy-groups'].push(
            this.createProxyGroup(t('outboundNames.Node Select'), 'select', options)
        );
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound !== t('outboundNames.Node Select')) {
                const options = this.buildAggregatedOptions(proxyList);
                this.config['proxy-groups'].push(
                    this.createProxyGroup(t(`outboundNames.${outbound}`), 'select', options)
                );
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                const options = this.buildAggregatedOptions(proxyList);
                this.config['proxy-groups'].push(
                    this.createProxyGroup(rule.name, 'select', options)
                );
            });
        }
    }

    addFallBackGroup(proxyList) {
        const options = this.buildAggregatedOptions(proxyList);
        this.config['proxy-groups'].push(
            this.createProxyGroup(t('outboundNames.Fall Back'), 'select', options)
        );
    }

    addCountryGroups() {
        const proxies = this.getProxies();
        const countryGroups = {};

        proxies.forEach(proxy => {
            const proxyName = this.getProxyName(proxy);
            const countryInfo = parseCountryFromNodeName(proxyName);
            if (countryInfo) {
                const { name } = countryInfo;
                if (!countryGroups[name]) {
                    countryGroups[name] = { ...countryInfo, proxies: [] };
                }
                countryGroups[name].proxies.push(proxyName);
            }
        });

        const existing = new Set((this.config['proxy-groups'] || [])
            .map(g => this.getProxyName(g)?.trim())
            .filter(Boolean));

        const manualProxyNames = proxies.map(p => this.getProxyName(p)).filter(Boolean);
        const manualGroupName = manualProxyNames.length > 0 ? t('outboundNames.Manual Switch') : null;
        if (manualGroupName) {
            const manualNorm = manualGroupName.trim();
            if (!existing.has(manualNorm)) {
                this.config['proxy-groups'].push(
                    this.createProxyGroup(manualGroupName, 'select', this.sanitizeOptions(manualProxyNames))
                );
                existing.add(manualNorm);
            }
        }

        const countryGroupNames = [];
        const countries = Object.keys(countryGroups).sort((a, b) => a.localeCompare(b));

        countries.forEach(country => {
            const { emoji, name, proxies } = countryGroups[country];
            const groupName = `${emoji} ${name}`;
            countryGroupNames.push(groupName);
            if (!existing.has(groupName.trim())) {
                this.config['proxy-groups'].push(
                    this.createProxyGroup(groupName, 'url-test', proxies, ', url=https://www.gstatic.com/generate_204, interval=300')
                );
                existing.add(groupName.trim());
            }
        });

        const nodeSelectGroupIndex = this.config['proxy-groups'].findIndex(g => this.getProxyName(g) === t('outboundNames.Node Select'));
        if (nodeSelectGroupIndex > -1) {
            const newOptions = this.withDirectReject([
                t('outboundNames.Auto Select'),
                ...(manualGroupName ? [manualGroupName] : []),
                ...countryGroupNames
            ]);
            const newGroup = this.createProxyGroup(t('outboundNames.Node Select'), 'select', newOptions);
            this.config['proxy-groups'][nodeSelectGroupIndex] = newGroup;
        }
        this.countryGroupNames = countryGroupNames;
        this.manualGroupName = manualGroupName;
    }

    formatConfig() {
        const rules = generateRules(this.selectedRules, this.customRules);
        let finalConfig = [];

        if (this.subscriptionUrl) {
            finalConfig.push(`#!MANAGED-CONFIG ${this.subscriptionUrl} interval=43200 strict=false`);
            finalConfig.push('');  // 添加一个空行
        }

        finalConfig.push('[General]');
        if (this.config.general) {
            Object.entries(this.config.general).forEach(([key, value]) => {
                finalConfig.push(`${key} = ${value}`);
            });
        }

        if (this.config.replica) {
            finalConfig.push('\n[Replica]');
            Object.entries(this.config.replica).forEach(([key, value]) => {
                finalConfig.push(`${key} = ${value}`);
            });
        }

        finalConfig.push('\n[Proxy]');
        finalConfig.push('DIRECT = direct');
        if (this.config.proxies) {
            finalConfig.push(...this.config.proxies);
        }

        finalConfig.push('\n[Proxy Group]');
        if (this.config['proxy-groups']) {
            finalConfig.push(...this.config['proxy-groups']);
        }

        finalConfig.push('\n[Rule]');

        // Rule-Set & Domain Rules & IP Rules:  To reduce DNS leaks and unnecessary DNS queries,
        // domain & non-IP rules must precede IP rules

        rules.filter(rule => !!rule.domain_suffix).map(rule => {
            rule.domain_suffix.forEach(suffix => {
                finalConfig.push(`DOMAIN-SUFFIX,${suffix},${t('outboundNames.'+ rule.outbound)}`);
            });
        });

        rules.filter(rule => !!rule.domain_keyword).map(rule => {
            rule.domain_keyword.forEach(keyword => {
                finalConfig.push(`DOMAIN-KEYWORD,${keyword},${t('outboundNames.'+ rule.outbound)}`);
            });
        });

        rules.filter(rule => rule.site_rules[0] !== '').map(rule => {
            rule.site_rules.forEach(site => {
                finalConfig.push(`RULE-SET,${SURGE_SITE_RULE_SET_BASEURL}${site}.conf,${t('outboundNames.'+ rule.outbound)}`);
            });
        });

        rules.filter(rule => rule.ip_rules[0] !== '').map(rule => {
            rule.ip_rules.forEach(ip => {
                finalConfig.push(`RULE-SET,${SURGE_IP_RULE_SET_BASEURL}${ip}.txt,${t('outboundNames.'+ rule.outbound)},no-resolve`);
            });
        });

        rules.filter(rule => !!rule.ip_cidr).map(rule => {
            rule.ip_cidr.forEach(cidr => {
                finalConfig.push(`IP-CIDR,${cidr},${t('outboundNames.'+ rule.outbound)},no-resolve`);
            });
        });

        finalConfig.push('FINAL,' + t('outboundNames.Fall Back'));

        return finalConfig.join('\n');
    }

    getCurrentUrl() {
        try {
            if (typeof self !== 'undefined' && self.location) {
                return self.location.href;
            }
            return null;
        } catch (error) {
            console.error('Error getting current URL:', error);
            return null;
        }
    }
}
