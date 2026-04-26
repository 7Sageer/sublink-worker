import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';

describe('Issue #371 - custom rule groups keep full proxy choices without country groups', () => {
    const inputString = [
        'ss://YWVzLTI1Ni1nY206dGVzdA==@us1.example.com:8388#US-Node-1',
        'ss://YWVzLTI1Ni1nY206dGVzdA==@uk1.example.com:8388#UK-Node-1'
    ].join('\n');

    const customRules = [
        { name: 'Custom-Rule', site_rules: ['google'], ip_rules: [], domain_suffix: [], domain_keyword: [] }
    ];

    const expectedCountryMembers = [
        '🚀 节点选择',
        '⚡ 自动选择',
        '🖐️ 手动切换',
        'US-Node-1',
        'UK-Node-1',
        'DIRECT',
        'REJECT'
    ];

    const expectedFlatMembers = [
        '🚀 节点选择',
        '⚡ 自动选择',
        'US-Node-1',
        'UK-Node-1',
        'DIRECT',
        'REJECT'
    ];

    const expectCompleteOptionsWithoutCountries = (members, expectedMembers) => {
        expect(members).toEqual(expectedMembers);
        expect(members.some(member =>
            member.includes('🇺🇸') || member.includes('🇬🇧') || member.includes('United States') || member.includes('United Kingdom')
        )).toBe(false);
    };

    it('Singbox custom rule includes direct proxy choices when groupByCountry is enabled', async () => {
        const builder = new SingboxConfigBuilder(
            inputString,
            'minimal',
            customRules,
            null,
            'zh-CN',
            '',
            true,
            false,
            null,
            null,
            '1.12',
            true
        );

        await builder.build();

        const customRule = builder.config.outbounds.find(outbound => outbound?.tag === 'Custom-Rule');
        expectCompleteOptionsWithoutCountries(customRule.outbounds, expectedCountryMembers);
    });

    it('Singbox custom rule includes direct proxy choices when groupByCountry is disabled', async () => {
        const builder = new SingboxConfigBuilder(
            inputString,
            'minimal',
            customRules,
            null,
            'zh-CN',
            '',
            false,
            false,
            null,
            null,
            '1.12',
            true
        );

        await builder.build();

        const customRule = builder.config.outbounds.find(outbound => outbound?.tag === 'Custom-Rule');
        expectCompleteOptionsWithoutCountries(customRule.outbounds, expectedFlatMembers);
    });

    it('Clash custom rule includes direct proxy choices when groupByCountry is enabled', async () => {
        const builder = new ClashConfigBuilder(
            inputString,
            'minimal',
            customRules,
            null,
            'zh-CN',
            '',
            true,
            false,
            null,
            null,
            true
        );

        await builder.build();

        const customRule = builder.config['proxy-groups'].find(group => group?.name === 'Custom-Rule');
        expectCompleteOptionsWithoutCountries(customRule.proxies, expectedCountryMembers);
    });

    it('Clash custom rule includes direct proxy choices when groupByCountry is disabled', async () => {
        const builder = new ClashConfigBuilder(
            inputString,
            'minimal',
            customRules,
            null,
            'zh-CN',
            '',
            false,
            false,
            null,
            null,
            true
        );

        await builder.build();

        const customRule = builder.config['proxy-groups'].find(group => group?.name === 'Custom-Rule');
        expectCompleteOptionsWithoutCountries(customRule.proxies, expectedFlatMembers);
    });

    it('Surge custom rule includes direct proxy choices when groupByCountry is enabled', async () => {
        const builder = new SurgeConfigBuilder(
            inputString,
            'minimal',
            customRules,
            null,
            'zh-CN',
            '',
            true,
            true
        );

        await builder.build();

        const customRule = builder.config['proxy-groups'].find(group =>
            typeof group === 'string' && group.startsWith('Custom-Rule = select')
        );
        expect(customRule).toBeDefined();

        const members = customRule
            .split(',')
            .slice(1)
            .map(member => member.trim());
        expectCompleteOptionsWithoutCountries(members, expectedCountryMembers);
    });

    it('Surge custom rule includes direct proxy choices when groupByCountry is disabled', async () => {
        const builder = new SurgeConfigBuilder(
            inputString,
            'minimal',
            customRules,
            null,
            'zh-CN',
            '',
            false,
            true
        );

        await builder.build();

        const customRule = builder.config['proxy-groups'].find(group =>
            typeof group === 'string' && group.startsWith('Custom-Rule = select')
        );
        expect(customRule).toBeDefined();

        const members = customRule
            .split(',')
            .slice(1)
            .map(member => member.trim());
        expectCompleteOptionsWithoutCountries(members, expectedFlatMembers);
    });
});
