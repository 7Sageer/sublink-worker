import { SING_BOX_CONFIG, generateRuleSets, generateRules, getOutbounds} from './config.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { DeepCopy } from './utils.js';

export class ConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules) {
        super(inputString, SING_BOX_CONFIG);
        this.selectedRules = selectedRules;
    }

    addCustomItems(customItems) {
        const validItems = customItems.filter(item => item != null);
        this.config.outbounds.push(...validItems);
    }

    addSelectors() {
        const outbounds = getOutbounds(this.selectedRules);
        const proxyList = this.config.outbounds.filter(outbound => outbound?.server != undefined).map(outbound => outbound.tag);
        
        this.config.outbounds.push({
            type: "urltest",
            tag: "⚡ 自动选择",
            outbounds: DeepCopy(proxyList),
        });

        proxyList.unshift('DIRECT', 'REJECT', '⚡ 自动选择');
        outbounds.unshift('🚀 节点选择', 'GLOBAL');
        outbounds.forEach(outbound => {
            if (outbound !== '🚀 节点选择') {
                this.config.outbounds.push({
                    type: "selector",
                    tag: outbound,
                    outbounds: ['🚀 节点选择', ...proxyList]
                });
            } else {
                this.config.outbounds.push({
                    type: "selector",
                    tag: outbound,
                    outbounds: proxyList
                });
            }
        });

        this.config.outbounds.push({
            type: "selector",
            tag: "🐟 漏网之鱼",
            outbounds: ['🚀 节点选择', ...proxyList]
        });
    }

    formatConfig() {
        const rules = generateRules(this.selectedRules);
        const { site_rule_sets, ip_rule_sets } = generateRuleSets(this.selectedRules);

        this.config.route.rule_set = [...site_rule_sets, ...ip_rule_sets];

        this.config.route.rules = rules.map(rule => ({
            rule_set: [...rule.site_rules, ...rule.ip_rules.map(ip => `${ip}-ip`)],
            outbound: rule.outbound
        }));

        // Add any default rules that should always be present
        this.config.route.rules.unshift(
            { protocol: 'dns', outbound: 'dns-out' },
            { clash_mode: 'direct', outbound: 'DIRECT' },
            { clash_mode: 'global', outbound: 'GLOBAL' }
        );

        this.config.route.auto_detect_interface = true;
        this.config.route.final = '🐟 漏网之鱼';

        return this.config;
    }
}