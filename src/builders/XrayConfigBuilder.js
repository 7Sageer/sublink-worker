import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { generateRules } from '../config/index.js';
import { IR_VERSION, downgradeByCaps, normalizeLegacyProxyToIR } from '../ir/index.js';
import { mapIRToXray } from '../ir/maps/xray.js';

const RESERVED_OUTBOUND_TAGS = new Set(['DIRECT', 'REJECT']);
const RESERVED_OUTBOUND_PROTOCOLS = new Set(['freedom', 'blackhole']);

export class XrayConfigBuilder extends BaseConfigBuilder {
    usesIR = true;

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
        const ir = proxy?.version === IR_VERSION ? proxy : normalizeLegacyProxyToIR(proxy);
        if (!ir) return null;
        const downgraded = downgradeByCaps(ir, 'xray');
        return mapIRToXray(downgraded);
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
