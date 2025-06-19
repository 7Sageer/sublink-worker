import { SING_BOX_CONFIG, generateRuleSets, generateRules, getOutbounds, PREDEFINED_RULE_SETS} from './config.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { DeepCopy } from './utils.js';
import { t } from './i18n/index.js';

export class SingboxConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent) {
        if (baseConfig === undefined) {
            baseConfig = SING_BOX_CONFIG;
            if (baseConfig.dns && baseConfig.dns.servers) {
                baseConfig.dns.servers[0].detour = t('outboundNames.Node Select');
            }
        }
        super(inputString, baseConfig, lang, userAgent);
        this.selectedRules = selectedRules;
        this.customRules = customRules;
    }

    getProxies() {
        return this.config.outbounds.filter(outbound => outbound?.server != undefined);
    }

    getProxyName(proxy) {
        return proxy.tag;
    }

    convertProxy(proxy) {
        return proxy;
    }

    addProxyToConfig(proxy) {
        // Check if there are proxies with similar tags in existing outbounds
        const similarProxies = this.config.outbounds.filter(p => p.tag && p.tag.includes(proxy.tag));

        // Check if there is a proxy with identical data (excluding the tag)
        const isIdentical = similarProxies.some(p => {
            const { tag: _, ...restOfProxy } = proxy; // Exclude the tag attribute
            const { tag: __, ...restOfP } = p;       // Exclude the tag attribute
            return JSON.stringify(restOfProxy) === JSON.stringify(restOfP);
        });

        if (isIdentical) {
            // If there is a proxy with identical data, skip adding it
            return;
        }

        // If there are proxies with similar tags but different data, modify the tag name
        if (similarProxies.length > 0) {
            proxy.tag = `${proxy.tag} ${similarProxies.length + 1}`;
        }

        this.config.outbounds.push(proxy);
    }

    addAutoSelectGroup(proxyList) {
        this.config.outbounds.unshift({
            type: "urltest",
            tag: t('outboundNames.Auto Select'),
            outbounds: DeepCopy(proxyList),
        });
    }

    addNodeSelectGroup(proxyList) {
        proxyList.unshift('DIRECT', t('outboundNames.Auto Select'));
        this.config.outbounds.unshift({
            type: "selector",
            tag: t('outboundNames.Node Select'),
            outbounds: proxyList
        });
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound !== t('outboundNames.Node Select')) {
                this.config.outbounds.push({
                    type: "selector",
                    tag: t(`outboundNames.${outbound}`),
                    outbounds: [t('outboundNames.Node Select'), ...proxyList]
                });
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                this.config.outbounds.push({
                    type: "selector",
                    tag: rule.name,
                    outbounds: [t('outboundNames.Node Select'), ...proxyList]
                });
            });
        }
    }

    addFallBackGroup(proxyList) {
        this.config.outbounds.push({
            type: "selector",
            tag: t('outboundNames.Fall Back'),
            outbounds: [t('outboundNames.Node Select'), ...proxyList]
        });
    }

    formatConfig() {
        const generatedRules = generateRules(this.selectedRules, this.customRules);
        const { site_rule_sets, ip_rule_sets } = generateRuleSets(this.selectedRules, this.customRules);

        this.config.route.rule_set = [...site_rule_sets, ...ip_rule_sets];
        this.config.route.rules = []; // Initialize/clear rules array

        const adBlockOutboundName = 'Ad Block';

        generatedRules.forEach(rule => {
            const ruleConfig = {};
            if (rule.domain_suffix && rule.domain_suffix.length > 0 && rule.domain_suffix.some(d => d !== '')) {
                ruleConfig.domain_suffix = rule.domain_suffix.filter(d => d !== '');
            }
            if (rule.domain_keyword && rule.domain_keyword.length > 0 && rule.domain_keyword.some(d => d !== '')) {
                ruleConfig.domain_keyword = rule.domain_keyword.filter(d => d !== '');
            }
            if (rule.protocol && rule.protocol.length > 0 && rule.protocol.some(p => p !== '')) {
                ruleConfig.protocol = rule.protocol.filter(p => p !== '');
            }

            const siteRuleSetNames = rule.site_rules && rule.site_rules.length > 0 && rule.site_rules[0] !== '' ? rule.site_rules : [];
            const ipRuleSetNames = rule.ip_rules && rule.ip_rules.filter(ip => ip.trim() !== '').map(ip => `${ip.trim()}-ip`);
            const combinedRuleSets = [...siteRuleSetNames, ...ipRuleSetNames].filter(rs => rs !== '');

            if (combinedRuleSets.length > 0) {
                ruleConfig.rule_set = combinedRuleSets;
            }

            if (rule.ip_cidr && rule.ip_cidr.length > 0 && rule.ip_cidr.some(ip => ip !== '')) {
                ruleConfig.ip_cidr = rule.ip_cidr.filter(ip => ip !== '');
            }

            // Ensure the rule has at least one matcher
            const hasMatchers = ruleConfig.domain_suffix || ruleConfig.domain_keyword || ruleConfig.rule_set || ruleConfig.ip_cidr || ruleConfig.protocol;

            if (hasMatchers) {
                if (rule.outbound === adBlockOutboundName) {
                    ruleConfig.action = "reject";
                } else {
                    ruleConfig.outbound = t(`outboundNames.${rule.outbound}`);
                }
                this.config.route.rules.push(ruleConfig);
            }
        });

        this.config.route.rules.unshift(
            { clash_mode: 'direct', outbound: 'DIRECT' },
            { clash_mode: 'global', outbound: t('outboundNames.Node Select') },
            { action: 'sniff' }, // Ensure sniff is added correctly as per original logic. The prompt mentioned {action: 'sniff'}
            { protocol: 'dns', action: 'hijack-dns' }
        );

        this.config.route.auto_detect_interface = true;
        this.config.route.final = t('outboundNames.Fall Back');

        return this.config;
    }
}