import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SING_BOX_CONFIG, SING_BOX_CONFIG_V1_11 } from '../src/config/singboxConfig.js';
import { generateRuleSets } from '../src/config/ruleGenerators.js';
import { SITE_RULE_SET_BASE_URL, IP_RULE_SET_BASE_URL } from '../src/config/ruleUrls.js';

const sampleInput = JSON.stringify({
    outbounds: [
        {
            type: 'vless',
            tag: 'test-proxy',
            server: 'example.com',
            server_port: 443,
            uuid: '00000000-0000-0000-0000-000000000000',
            tls: { enabled: true, server_name: 'example.com' }
        }
    ]
});

const versions = [
    { version: '1.14', baseConfig: SING_BOX_CONFIG },
    { version: '1.12', baseConfig: SING_BOX_CONFIG },
    { version: '1.11', baseConfig: SING_BOX_CONFIG_V1_11 }
];

function buildConfig(version, baseConfig, selectedRules = [], customRules = []) {
    return new SingboxConfigBuilder(
        sampleInput, selectedRules, customRules, baseConfig, 'zh-CN', null,
        false, false, null, null, version
    ).build();
}

describe.each(versions)('sing-box $version DNS fallback (issue #432)', ({ version, baseConfig }) => {
    it('keeps fake IP scoped to known foreign domains and resolves unknown domains through the proxy', async () => {
        const config = await buildConfig(version, baseConfig);
        const policyRules = version === '1.11' ? config.dns.rules.slice(1) : config.dns.rules;

        expect(policyRules.slice(0, 4)).toEqual([
            {
                clash_mode: 'direct',
                query_type: ['A', 'AAAA', 'CNAME'],
                server: 'dns_direct'
            },
            {
                rule_set: ['geolocation-cn', 'cn'],
                query_type: ['A', 'AAAA', 'CNAME'],
                server: 'dns_direct'
            },
            {
                rule_set: 'geolocation-!cn',
                query_type: ['A', 'AAAA'],
                server: 'dns_fakeip'
            },
            {
                query_type: ['A', 'AAAA', 'CNAME'],
                server: 'dns_proxy'
            }
        ]);
        expect(policyRules).toHaveLength(5);
        expect(config.dns.servers.find(server => server.tag === 'dns_proxy').detour).toBe('🚀 节点选择');
        expect(config.dns.final).toBe('dns_direct');
        expect(policyRules[4]).toEqual(version === '1.11' ? {
            query_type: ['A', 'AAAA', 'CNAME'], invert: true, server: 'dns_direct', disable_cache: true
        } : {
            query_type: ['A', 'AAAA', 'CNAME'], invert: true, action: 'predefined', rcode: 'REFUSED'
        });
    });

    it('resolves outbound server domains independently of proxied DNS queries', async () => {
        const config = await buildConfig(version, baseConfig);

        if (version === '1.11') {
            expect(config.dns.rules[0]).toEqual({ outbound: 'any', server: 'dns_resolver' });
            expect(config.dns.servers.find(server => server.tag === 'dns_resolver')).toEqual({
                tag: 'dns_resolver', address: '223.5.5.5', detour: 'DIRECT'
            });
        } else {
            expect(config.route.default_domain_resolver).toBe('dns_resolver');
            expect(config.dns.rules.some(rule => rule.outbound)).toBe(false);
        }
    });

    it('includes every required DNS rule set without Location:CN selected', async () => {
        const config = await buildConfig(version, baseConfig, ['Private']);
        const availableTags = config.route.rule_set.map(ruleSet => ruleSet.tag);
        const referencedTags = config.dns.rules.flatMap(rule => {
            if (Array.isArray(rule.rule_set)) return rule.rule_set;
            return rule.rule_set ? [rule.rule_set] : [];
        });

        expect(availableTags).toEqual(expect.arrayContaining([
            ...referencedTags,
            'geolocation-cn',
            'cn',
            'geolocation-!cn'
        ]));
        expect(new Set(availableTags).size).toBe(availableTags.length);
    });

    it('deduplicates DNS dependencies also referenced by custom rules without Location:CN', async () => {
        const config = await buildConfig(version, baseConfig, ['Private'], [
            { name: 'CustomCN', site: 'cn,geolocation-cn,cn', ip: 'private,cn,cn' },
            { name: 'OtherCN', site: ['geolocation-cn', 'cn'], ip: ['cn'] }
        ]);
        const tags = config.route.rule_set.map(ruleSet => ruleSet.tag);

        expect(tags).toEqual(['geolocation-cn', 'cn', 'geolocation-!cn', 'private-ip', 'cn-ip']);
        expect(config.route.rules).toContainEqual({
            rule_set: ['geolocation-cn', 'cn'],
            outbound: 'OtherCN'
        });
    });
});

describe('sing-box rule-set collection', () => {
    it('deduplicates all sources while preserving first-seen order and custom URLs', () => {
        const customRules = [
            { site: 'google,custom-site,cn,custom-site', ip: ['google', 'custom-net'] },
            { site: ['custom-site', 'second-site'], ip: 'custom-net,second-net' }
        ];
        const originalRules = structuredClone(customRules);
        const { site_rule_sets, ip_rule_sets } = generateRuleSets(['Google'], customRules);

        expect(site_rule_sets.map(rule => rule.tag)).toEqual([
            'google', 'geolocation-cn', 'cn', 'geolocation-!cn', 'custom-site', 'second-site'
        ]);
        expect(ip_rule_sets.map(rule => rule.tag)).toEqual(['google-ip', 'custom-net-ip', 'second-net-ip']);
        expect(site_rule_sets.map(rule => rule.url)).toEqual(site_rule_sets.map(rule => `${SITE_RULE_SET_BASE_URL}${rule.tag}.srs`));
        expect(ip_rule_sets.map(rule => rule.url)).toEqual([
            `${IP_RULE_SET_BASE_URL}google.srs`,
            `${IP_RULE_SET_BASE_URL}custom-net.srs`,
            `${IP_RULE_SET_BASE_URL}second-net.srs`
        ]);
        expect(customRules).toEqual(originalRules);
    });

    it('continues to reject unsafe custom identifiers before collecting rule sets', () => {
        const unsafeIds = ['../cn', '.hidden', 'a..b', 'https://evil.example/rule', 'cn?x=1', 'cn#fragment', 'a/b', 42, null];
        const { site_rule_sets, ip_rule_sets } = generateRuleSets(['Private'], [{
            site: [...unsafeIds, ' safe-site.example '],
            ip: [...unsafeIds, 'safe-net']
        }]);

        expect(site_rule_sets.map(rule => rule.tag)).toEqual(['geolocation-cn', 'cn', 'geolocation-!cn', 'safe-site.example']);
        expect(ip_rule_sets.map(rule => rule.tag)).toEqual(['private-ip', 'safe-net-ip']);
    });
});
