import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { groupProxiesByCountry } from '../utils.js';
import { SURGE_CONFIG, SURGE_SITE_RULE_SET_BASEURL, SURGE_IP_RULE_SET_BASEURL, generateRules, getOutbounds, PREDEFINED_RULE_SETS } from '../config/index.js';
import { addProxyWithDedup } from './helpers/proxyHelpers.js';
import { buildSelectorMembers, buildNodeSelectMembers, uniqueNames } from './helpers/groupBuilder.js';

export class SurgeConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry) {
        const resolvedBaseConfig = baseConfig ?? SURGE_CONFIG;
        super(inputString, resolvedBaseConfig, lang, userAgent, groupByCountry);
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
        addProxyWithDedup(this.config.proxies, proxy, {
            getName: (item) => this.getProxyName(item),
            setName: (value, name) => {
                const equalsPos = typeof value === 'string' ? value.indexOf('=') : -1;
                if (equalsPos > 0) {
                    return `${name}${value.substring(equalsPos)}`;
                }
                return value;
            },
            isSame: (existing, incoming) => {
                if (typeof existing !== 'string' || typeof incoming !== 'string') return false;
                const existingSuffix = existing.substring(existing.indexOf('='));
                const incomingSuffix = incoming.substring(incoming.indexOf('='));
                return existingSuffix === incomingSuffix;
            }
        });
    }

    hasProxyGroup(name) {
        const target = typeof name === 'string' ? name.trim() : name;
        if (!target) return false;
        return (this.config['proxy-groups'] || []).some(group => {
            // Handle both Surge string format and Clash object format
            let existing;
            if (typeof group === 'string') {
                existing = this.getProxyName(group)?.trim();
            } else if (group && typeof group === 'object') {
                existing = (group.name || '').trim();
            }
            return existing === target;
        });
    }

    /**
     * Get group name from either string or object format
     * @param {string|object} group - Surge string or Clash object format group
     * @returns {string|undefined}
     */
    getGroupName(group) {
        if (typeof group === 'string') {
            return this.getProxyName(group);
        } else if (group && typeof group === 'object') {
            return group.name;
        }
        return undefined;
    }

    /**
     * Convert Clash object-format proxy-group to Surge string format
     * @param {object} group - Clash format group {name, type, proxies, url?, interval?}
     * @returns {string} - Surge format string like "Name = type, proxy1, proxy2, url=..., interval=..."
     */
    convertObjectGroupToSurgeString(group) {
        if (!group || !group.name || !group.type) {
            return null;
        }

        const name = group.name;
        const type = group.type === 'url-test' ? 'url-test' : 'select';
        const proxies = Array.isArray(group.proxies) ? group.proxies : [];

        let result = `${name} = ${type}`;
        if (proxies.length > 0) {
            result += `, ${proxies.join(', ')}`;
        }

        // Add url-test specific fields
        if (type === 'url-test') {
            if (group.url) {
                result += `, url=${group.url}`;
            } else {
                result += ', url=http://www.gstatic.com/generate_204';
            }
            if (group.interval) {
                result += `, interval=${group.interval}`;
            } else {
                result += ', interval=300';
            }
        }

        return result;
    }

    createProxyGroup(name, type, options = [], extraConfig = '') {
        const sanitized = this.sanitizeOptions(options);
        const optionsPart = sanitized.length > 0 ? `, ${sanitized.join(', ')}` : '';
        return `${name} = ${type}${optionsPart}${extraConfig}`;
    }

    sanitizeOptions(options = []) {
        return uniqueNames(options);
    }

    buildNodeSelectOptions(proxyList = []) {
        return buildNodeSelectMembers({
            proxyList,
            translator: this.t,
            groupByCountry: false,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames
        });
    }

    buildAggregatedOptions(proxyList = []) {
        return buildSelectorMembers({
            proxyList,
            translator: this.t,
            groupByCountry: this.groupByCountry,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames
        });
    }

    addAutoSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        const name = this.t('outboundNames.Auto Select');
        if (this.hasProxyGroup(name)) return;
        this.config['proxy-groups'].push(
            this.createProxyGroup(
                name,
                'url-test',
                this.sanitizeOptions(proxyList),
                ', url=http://www.gstatic.com/generate_204, interval=300'
            )
        );
    }

    addNodeSelectGroup(proxyList) {
        const options = this.buildNodeSelectOptions(proxyList);
        if (this.hasProxyGroup(this.t('outboundNames.Node Select'))) return;
        this.config['proxy-groups'].push(
            this.createProxyGroup(this.t('outboundNames.Node Select'), 'select', options)
        );
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound !== this.t('outboundNames.Node Select')) {
                const options = this.buildAggregatedOptions(proxyList);
                const name = this.t(`outboundNames.${outbound}`);
                if (this.hasProxyGroup(name)) {
                    return;
                }
                this.config['proxy-groups'].push(
                    this.createProxyGroup(name, 'select', options)
                );
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                const options = this.buildAggregatedOptions(proxyList);
                if (this.hasProxyGroup(rule.name)) return;
                this.config['proxy-groups'].push(
                    this.createProxyGroup(rule.name, 'select', options)
                );
            });
        }
    }

    addFallBackGroup(proxyList) {
        const options = this.buildAggregatedOptions(proxyList);
        if (this.hasProxyGroup(this.t('outboundNames.Fall Back'))) return;
        this.config['proxy-groups'].push(
            this.createProxyGroup(this.t('outboundNames.Fall Back'), 'select', options)
        );
    }

    addCountryGroups() {
        const proxies = this.getProxies();
        const countryGroups = groupProxiesByCountry(proxies, {
            getName: proxy => this.getProxyName(proxy)
        });

        const existing = new Set((this.config['proxy-groups'] || [])
            .map(g => this.getGroupName(g)?.trim())
            .filter(Boolean));

        const manualProxyNames = proxies.map(p => this.getProxyName(p)).filter(Boolean);
        const manualGroupName = manualProxyNames.length > 0 ? this.t('outboundNames.Manual Switch') : null;
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

        const nodeSelectGroupIndex = this.config['proxy-groups'].findIndex(g => this.getGroupName(g) === this.t('outboundNames.Node Select'));
        if (nodeSelectGroupIndex > -1) {
            const newOptions = buildNodeSelectMembers({
                proxyList: [],
                translator: this.t,
                groupByCountry: true,
                manualGroupName,
                countryGroupNames
            });
            const newGroup = this.createProxyGroup(this.t('outboundNames.Node Select'), 'select', newOptions);
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
            // Convert object-format groups to Surge string format
            const groupStrings = this.config['proxy-groups'].map(group => {
                if (typeof group === 'string') {
                    return group;
                } else if (group && typeof group === 'object') {
                    return this.convertObjectGroupToSurgeString(group);
                }
                return null;
            }).filter(g => g != null);
            finalConfig.push(...groupStrings);
        }

        finalConfig.push('\n[Rule]');

        // Rule-Set & Domain Rules & IP Rules:  To reduce DNS leaks and unnecessary DNS queries,
        // domain & non-IP rules must precede IP rules

        rules.filter(rule => !!rule.domain_suffix).map(rule => {
            rule.domain_suffix.forEach(suffix => {
                finalConfig.push(`DOMAIN-SUFFIX,${suffix},${this.t('outboundNames.' + rule.outbound)}`);
            });
        });

        rules.filter(rule => !!rule.domain_keyword).map(rule => {
            rule.domain_keyword.forEach(keyword => {
                finalConfig.push(`DOMAIN-KEYWORD,${keyword},${this.t('outboundNames.' + rule.outbound)}`);
            });
        });

        rules.filter(rule => rule.site_rules[0] !== '').map(rule => {
            rule.site_rules.forEach(site => {
                finalConfig.push(`RULE-SET,${SURGE_SITE_RULE_SET_BASEURL}${site}.conf,${this.t('outboundNames.' + rule.outbound)}`);
            });
        });

        rules.filter(rule => rule.ip_rules[0] !== '').map(rule => {
            rule.ip_rules.forEach(ip => {
                finalConfig.push(`RULE-SET,${SURGE_IP_RULE_SET_BASEURL}${ip}.txt,${this.t('outboundNames.' + rule.outbound)},no-resolve`);
            });
        });

        rules.filter(rule => !!rule.ip_cidr).map(rule => {
            rule.ip_cidr.forEach(cidr => {
                finalConfig.push(`IP-CIDR,${cidr},${this.t('outboundNames.' + rule.outbound)},no-resolve`);
            });
        });

        finalConfig.push('FINAL,' + this.t('outboundNames.Fall Back'));

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
