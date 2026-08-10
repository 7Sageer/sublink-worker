import { describe, it, expect, vi, afterEach } from 'vitest';
import yaml from 'js-yaml';

vi.mock('../src/parsers/subscription/httpSubscriptionFetcher.js', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        fetchSubscriptionWithFormat: vi.fn()
    };
});

import { fetchSubscriptionWithFormat } from '../src/parsers/subscription/httpSubscriptionFetcher.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

/**
 * Issue #403: a Clash YAML subscription goes into proxy-provider mode, which
 * used to skip parsing entirely, so no country groups were ever created.
 * mihomo supports per-group `use` + `filter`, so country groups are now built
 * over provider members using the node names seen at fetch time.
 */
const mockClashYaml = `
proxies:
  - name: 香港节点01
    type: ss
    server: hk.example.com
    port: 443
    cipher: aes-128-gcm
    password: test123
  - name: 日本节点01
    type: ss
    server: jp.example.com
    port: 443
    cipher: aes-128-gcm
    password: test456
`;

const SUB_URL = 'https://example.com/clash-sub?token=xxx';

const mockClashSubscription = () => {
    fetchSubscriptionWithFormat.mockResolvedValue({
        content: mockClashYaml,
        format: 'clash',
        url: SUB_URL
    });
};

const findGroup = (config, name) => (config['proxy-groups'] || []).find(g => g && g.name === name);

// mihomo compiles filters with RE2 where (?i) is valid; JS needs the flag instead
const toJsRegex = (filter) => new RegExp(filter.replace(/^\(\?i\)/, ''), 'i');

describe('issue #403: country groups in proxy-provider mode', () => {
    afterEach(() => vi.clearAllMocks());

    it('creates country groups with use+filter when input is a Clash subscription', async () => {
        mockClashSubscription();
        const builder = new ClashConfigBuilder(SUB_URL, [], [], null, 'zh-CN', 'test-agent', true);
        const config = yaml.load(await builder.build());

        expect(config['proxy-providers']).toBeDefined();

        const hkGroup = findGroup(config, '🇭🇰 Hong Kong');
        expect(hkGroup).toBeDefined();
        expect(hkGroup.type).toBe('url-test');
        // no inline nodes in pure provider mode; membership comes from the provider
        expect(hkGroup.proxies || []).toHaveLength(0);
        expect(hkGroup.use).toEqual(Object.keys(config['proxy-providers']));
        expect(hkGroup.filter).toBeDefined();

        const jpGroup = findGroup(config, '🇯🇵 Japan');
        expect(jpGroup).toBeDefined();
        expect(jpGroup.use).toEqual(hkGroup.use);
        expect(jpGroup.filter).toBeDefined();
        expect(jpGroup.filter).not.toBe(hkGroup.filter);
    });

    it('filter regex matches the provider node names of its own country only', async () => {
        mockClashSubscription();
        const builder = new ClashConfigBuilder(SUB_URL, [], [], null, 'zh-CN', 'test-agent', true);
        const config = yaml.load(await builder.build());

        const hkFilter = toJsRegex(findGroup(config, '🇭🇰 Hong Kong').filter);
        const jpFilter = toJsRegex(findGroup(config, '🇯🇵 Japan').filter);

        expect(hkFilter.test('香港节点01')).toBe(true);
        expect(hkFilter.test('日本节点01')).toBe(false);
        expect(jpFilter.test('日本节点01')).toBe(true);
        expect(jpFilter.test('香港节点01')).toBe(false);
        // word-boundary rule: "plus" must not match the US alias
        const usYaml = mockClashYaml.replace('日本节点01', 'US-Node');
        fetchSubscriptionWithFormat.mockResolvedValue({ content: usYaml, format: 'clash', url: SUB_URL });
        const builder2 = new ClashConfigBuilder(SUB_URL, [], [], null, 'zh-CN', 'test-agent', true);
        const config2 = yaml.load(await builder2.build());
        const usFilter = toJsRegex(findGroup(config2, '🇺🇸 United States').filter);
        expect(usFilter.test('plus-node')).toBe(false);
        expect(usFilter.test('US-Node')).toBe(true);
    });

    it('keeps inline proxies and narrows provider members in mixed mode', async () => {
        mockClashSubscription();
        const inline = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Inline';
        const builder = new ClashConfigBuilder(`${inline}\n${SUB_URL}`, [], [], null, 'zh-CN', 'test-agent', true);
        const config = yaml.load(await builder.build());

        const hkGroup = findGroup(config, '🇭🇰 Hong Kong');
        expect(hkGroup.proxies).toContain('HK-Inline');
        expect(hkGroup.use).toBeDefined();
        // filter prevents every provider node from landing in every country group
        expect(hkGroup.filter).toBeDefined();

        // Japan exists only via the provider, so no inline members
        const jpGroup = findGroup(config, '🇯🇵 Japan');
        expect(jpGroup.proxies || []).toHaveLength(0);
        expect(jpGroup.filter).toBeDefined();
    });

    it('does not add filter when there are no providers (unchanged legacy path)', async () => {
        const input = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#香港节点';
        const builder = new ClashConfigBuilder(input, [], [], null, 'zh-CN', 'test-agent', true);
        const config = yaml.load(await builder.build());

        const hkGroup = findGroup(config, '🇭🇰 Hong Kong');
        expect(hkGroup).toBeDefined();
        expect(hkGroup.use).toBeUndefined();
        expect(hkGroup.filter).toBeUndefined();
    });

    it('references the new country groups from the Node Select group', async () => {
        mockClashSubscription();
        const builder = new ClashConfigBuilder(SUB_URL, [], [], null, 'zh-CN', 'test-agent', true);
        const config = yaml.load(await builder.build());

        const nodeSelect = findGroup(config, '🚀 节点选择');
        expect(nodeSelect).toBeDefined();
        expect(nodeSelect.proxies).toContain('🇭🇰 Hong Kong');
        expect(nodeSelect.proxies).toContain('🇯🇵 Japan');
    });
});
