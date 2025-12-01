export function emitClashRules(rules = [], translator) {
    if (!translator) {
        throw new Error('emitClashRules requires a translator function');
    }
    const results = [];
    rules
        .filter(rule => Array.isArray(rule.domain_suffix) && rule.domain_suffix.length > 0)
        .forEach(rule => {
            rule.domain_suffix.forEach(suffix => {
                results.push(`DOMAIN-SUFFIX,${suffix},${translator('outboundNames.' + rule.outbound)}`);
            });
        });

    rules
        .filter(rule => Array.isArray(rule.domain_keyword) && rule.domain_keyword.length > 0)
        .forEach(rule => {
            rule.domain_keyword.forEach(keyword => {
                results.push(`DOMAIN-KEYWORD,${keyword},${translator('outboundNames.' + rule.outbound)}`);
            });
        });

    rules
        .filter(rule => Array.isArray(rule.site_rules) && rule.site_rules[0])
        .forEach(rule => {
            rule.site_rules.forEach(site => {
                results.push(`RULE-SET,${site},${translator('outboundNames.' + rule.outbound)}`);
            });
        });

    rules
        .filter(rule => Array.isArray(rule.ip_rules) && rule.ip_rules[0])
        .forEach(rule => {
            rule.ip_rules.forEach(ip => {
                results.push(`RULE-SET,${ip},${translator('outboundNames.' + rule.outbound)},no-resolve`);
            });
        });

    rules
        .filter(rule => Array.isArray(rule.ip_cidr) && rule.ip_cidr.length > 0)
        .forEach(rule => {
            rule.ip_cidr.forEach(cidr => {
                results.push(`IP-CIDR,${cidr},${translator('outboundNames.' + rule.outbound)},no-resolve`);
            });
        });

    return results;
}

const normalize = (s) => typeof s === 'string' ? s.trim() : s;

export function sanitizeClashProxyGroups(config) {
    const groups = config['proxy-groups'] || [];
    if (!Array.isArray(groups) || groups.length === 0) {
        return;
    }
    const proxyNames = new Set((config.proxies || []).map(p => normalize(p?.name)).filter(Boolean));
    const groupNames = new Set(groups.map(g => normalize(g?.name)).filter(Boolean));
    const validNames = new Set(['DIRECT', 'REJECT'].map(normalize));
    proxyNames.forEach(n => validNames.add(n));
    groupNames.forEach(n => validNames.add(n));

    config['proxy-groups'] = groups.map(group => {
        if (!group || !Array.isArray(group.proxies)) return group;
        const filtered = group.proxies
            .map(x => typeof x === 'string' ? x.trim() : x)
            .filter(x => typeof x === 'string' && validNames.has(normalize(x)));
        const seen = new Set();
        const deduped = filtered.filter(value => {
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
        return { ...group, proxies: deduped };
    });
}
