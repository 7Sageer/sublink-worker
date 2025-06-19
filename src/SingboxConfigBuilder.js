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

    _buildOutbounds() {
        const actualProxyTags = this.config.outbounds
            .filter(o => o.server !== undefined) // Heuristic to identify actual proxies
            .map(p => p.tag);

        let newOutbounds = [...SING_BOX_CONFIG.outbounds]; // Start with base (DIRECT, REJECT - though REJECT was removed)

        // 1. Auto Select Outbound
        newOutbounds.push({
            type: "urltest",
            tag: t('outboundNames.Auto Select'),
            outbounds: DeepCopy(actualProxyTags),
            url: 'http://www.gstatic.com/generate_204', // Standard test URL
            interval: 300, // Standard interval
            lazy: false
        });

        // 2. Node Select Outbound
        newOutbounds.push({
            type: "selector",
            tag: t('outboundNames.Node Select'),
            outbounds: [
                t('outboundNames.Auto Select'),
                'DIRECT',
                ...actualProxyTags
            ]
        });

        // 3. Lazy Config Outbound
        newOutbounds.push({
            type: "selector",
            tag: t('outboundNames.Lazy Config'),
            outbounds: [
                t('outboundNames.Node Select'),
                t('outboundNames.Auto Select'),
                'DIRECT'
            ]
        });

        // 4. Uncaught Fish Outbound
        newOutbounds.push({
            type: "selector",
            tag: t('outboundNames.Uncaught Fish'),
            outbounds: [
                t('outboundNames.Lazy Config'),
                t('outboundNames.Node Select'),
                t('outboundNames.Auto Select'),
                'DIRECT'
            ]
        });

        // Add actual proxy server configurations (already in this.config.outbounds if super.formatConfig or equivalent was called)
        // So, we need to merge `newOutbounds` with `this.config.outbounds` containing proxies.
        // Or, ensure this.config.outbounds only contains proxies before this step, then add them.

        // Let's assume `this.config.outbounds` currently holds the base + actual proxies.
        // We will filter out the base ones if they are re-added, then concat.
        const currentProxies = this.config.outbounds.filter(o => o.server !== undefined);
        newOutbounds.push(...currentProxies);


        // 5. Service-specific and Custom Rule Selector Outbounds
        const unifiedRuleObjects = generateRules(this.selectedRules, this.customRules);
        const adBlockOutboundName = 'Ad Block';

        unifiedRuleObjects.forEach(rule => {
            if (rule.outbound !== adBlockOutboundName) { // Don't create a selector for Ad Block
                const groupTag = t(`outboundNames.${rule.outbound}`);
                newOutbounds.push({
                    type: 'selector',
                    tag: groupTag,
                    outbounds: [
                        t('outboundNames.Lazy Config'),
                        t('outboundNames.Node Select'),
                        t('outboundNames.Auto Select'),
                        'DIRECT',
                        ...actualProxyTags
                    ]
                });
            }
        });

        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                // Avoid duplicating if a custom rule has the same name as a unified rule
                const groupTag = t(`outboundNames.${rule.name}`); // Assuming custom rule.name is used for translation key
                if (!newOutbounds.find(o => o.tag === groupTag)) {
                    newOutbounds.push({
                        type: 'selector',
                        tag: groupTag,
                        outbounds: [
                            t('outboundNames.Lazy Config'),
                            t('outboundNames.Node Select'),
                            t('outboundNames.Auto Select'),
                            'DIRECT',
                            ...actualProxyTags
                        ]
                    });
                }
            });
        }

        // Deduplicate outbounds by tag, keeping the first occurrence
        const finalOutbounds = [];
        const seenTags = new Set();
        // Ensure DIRECT (and REJECT if it were still there) from base config are prioritized if not re-added
        // SING_BOX_CONFIG.outbounds was already added at the start of newOutbounds.

        for (const outbound of newOutbounds) {
            if (!seenTags.has(outbound.tag)) {
                finalOutbounds.push(outbound);
                seenTags.add(outbound.tag);
            }
        }
        this.config.outbounds = finalOutbounds;
    }

    formatConfig() {
        // Call super.formatConfig() or equivalent part that parses proxies from inputString
        // and adds them via this.addProxyToConfig().
        // For this refactor, we assume `this.config.outbounds` (from constructor's baseConfig)
        // already contains the initial base (DIRECT) and then `this.addProxyToConfig` has added the actual proxies.

        // Then, build the rest of the outbounds structure
        this._buildOutbounds();

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
        this.config.route.final = t('outboundNames.Uncaught Fish'); // Updated final route

        return this.config;
    }
}