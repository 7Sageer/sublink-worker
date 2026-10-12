import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SING_BOX_CONFIG, SING_BOX_CONFIG_V1_11 } from '../src/config/singboxConfig.js';

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
    { version: '1.12', baseConfig: SING_BOX_CONFIG },
    { version: '1.11', baseConfig: SING_BOX_CONFIG_V1_11 }
];

function buildConfig(version, baseConfig, selectedRules = []) {
    return new SingboxConfigBuilder(
        sampleInput, selectedRules, [], baseConfig, 'zh-CN', null,
        false, false, null, null, version
    ).build();
}

describe.each(versions)('sing-box $version DNS fallback (issue #432)', ({ version, baseConfig }) => {
    it('uses direct DNS only for China and fake IP for all other address queries', async () => {
        const config = await buildConfig(version, baseConfig);

        expect(config.dns.rules.slice(0, 3)).toEqual([
            {
                rule_set: ['geolocation-cn', 'cn'],
                query_type: ['A', 'AAAA', 'CNAME'],
                server: 'dns_direct'
            },
            {
                query_type: ['A', 'AAAA'],
                server: 'dns_fakeip'
            },
            {
                query_type: 'CNAME',
                server: 'dns_proxy'
            }
        ]);
        expect(config.dns.rules).toHaveLength(4);
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
});
