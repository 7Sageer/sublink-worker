import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import yaml from 'js-yaml';

// Mock the httpSubscriptionFetcher module
vi.mock('../src/parsers/subscription/httpSubscriptionFetcher.js', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        fetchSubscriptionWithFormat: vi.fn()
    };
});

// Import after mocking
import { fetchSubscriptionWithFormat } from '../src/parsers/subscription/httpSubscriptionFetcher.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

// Mock Clash subscription content
const mockClashYaml = `
proxies:
  - name: HK-Node
    type: ss
    server: hk.example.com
    port: 443
    cipher: aes-128-gcm
    password: test123
  - name: JP-Node
    type: ss
    server: jp.example.com
    port: 443
    cipher: aes-128-gcm
    password: test456
`;

// Mock Sing-Box subscription content
const mockSingboxJson = JSON.stringify({
    outbounds: [
        { type: 'shadowsocks', tag: 'SS-HK', server: 'hk.example.com', server_port: 443, method: 'aes-128-gcm', password: 'test' },
        { type: 'shadowsocks', tag: 'SS-JP', server: 'jp.example.com', server_port: 443, method: 'aes-128-gcm', password: 'test' }
    ]
});

describe('Auto Proxy Providers Detection', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Clash Builder', () => {
        it('should use Clash URL as proxy-provider when format is Clash YAML', async () => {
            // Mock fetchSubscriptionWithFormat to return Clash format
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: mockClashYaml,
                format: 'clash',
                url: 'https://example.com/clash-sub?token=xxx'
            });

            const builder = new ClashConfigBuilder(
                'https://example.com/clash-sub?token=xxx',
                [], // selectedRules
                [], // customRules
                null, // baseConfig
                'zh-CN', // lang
                'test-agent' // userAgent
            );
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            // Should have proxy-providers
            expect(config['proxy-providers']).toBeDefined();
            expect(Object.keys(config['proxy-providers'])).toHaveLength(1);
            expect(config['proxy-providers'].provider1).toBeDefined();
            expect(config['proxy-providers'].provider1.url).toBe('https://example.com/clash-sub?token=xxx');
            expect(config['proxy-providers'].provider1.type).toBe('http');

            // proxy-groups should have 'use' field
            const nodeSelect = config['proxy-groups'].find(g => g.name === '🚀 节点选择');
            expect(nodeSelect.use).toContain('provider1');
        });

        it('should parse and convert Sing-Box URL (incompatible format)', async () => {
            // Mock fetchSubscriptionWithFormat to return Sing-Box format
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: mockSingboxJson,
                format: 'singbox',
                url: 'https://example.com/singbox-sub'
            });

            const builder = new ClashConfigBuilder(
                'https://example.com/singbox-sub',
                [],
                [],
                null,
                'zh-CN',
                'test-agent'
            );
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            // Should NOT have proxy-providers with our URLs (incompatible format - singbox format for clash builder)
            // When no providers are added, proxy-providers should not exist
            const hasProviders = config['proxy-providers'] && Object.keys(config['proxy-providers']).length > 0;
            expect(hasProviders).toBeFalsy();

            // Should have parsed proxies from sing-box config
            expect(config.proxies.length).toBeGreaterThan(0);
        });
    });

    describe('Sing-Box Builder', () => {
        it('should use Sing-Box URL as outbound_provider when format is Sing-Box JSON', async () => {
            // Mock fetchSubscriptionWithFormat to return Sing-Box format
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: mockSingboxJson,
                format: 'singbox',
                url: 'https://example.com/singbox-sub?token=xxx'
            });

            const builder = new SingboxConfigBuilder(
                'https://example.com/singbox-sub?token=xxx',
                [],
                [],
                null,
                'zh-CN',
                'test-agent'
            );
            await builder.build();
            const config = builder.config;

            // Should have outbound_providers
            expect(config.outbound_providers).toBeDefined();
            expect(config.outbound_providers).toHaveLength(1);
            expect(config.outbound_providers[0].download_url).toBe('https://example.com/singbox-sub?token=xxx');
            expect(config.outbound_providers[0].type).toBe('http');

            // outbounds should have 'providers' field
            const nodeSelect = config.outbounds.find(o => o.tag === '🚀 节点选择');
            expect(nodeSelect.providers).toContain('provider1');
        });

        it('should parse and convert Clash URL (incompatible format)', async () => {
            // Mock fetchSubscriptionWithFormat to return Clash format
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: mockClashYaml,
                format: 'clash',
                url: 'https://example.com/clash-sub'
            });

            const builder = new SingboxConfigBuilder(
                'https://example.com/clash-sub',
                [],
                [],
                null,
                'zh-CN',
                'test-agent'
            );
            await builder.build();
            const config = builder.config;

            // Should NOT have outbound_providers (incompatible format)
            expect(config.outbound_providers).toBeUndefined();

            // Should have parsed outbounds from Clash YAML
            const proxyOutbounds = config.outbounds.filter(o => o.server);
            expect(proxyOutbounds.length).toBeGreaterThan(0);
        });

        it('should NOT use outbound_providers for Sing-Box 1.11 (not supported)', async () => {
            // Mock fetchSubscriptionWithFormat to return Sing-Box format
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: mockSingboxJson,
                format: 'singbox',
                url: 'https://example.com/singbox-sub'
            });

            // Use version 1.11 - providers NOT supported
            const builder = new SingboxConfigBuilder(
                'https://example.com/singbox-sub',
                [],
                [],
                null,
                'zh-CN',
                'test-agent',
                false,  // groupByCountry
                false,  // enableClashUI
                null,   // externalController
                null,   // externalUiDownloadUrl
                '1.11'  // singboxVersion - 1.11 does NOT support providers
            );
            await builder.build();
            const config = builder.config;

            // Should NOT have outbound_providers (1.11 doesn't support it)
            expect(config.outbound_providers).toBeUndefined();

            // Should have parsed outbounds instead
            const proxyOutbounds = config.outbounds.filter(o => o.server);
            expect(proxyOutbounds.length).toBeGreaterThan(0);
        });
    });

    describe('Multiple URLs', () => {
        it('should handle multiple Clash URLs as multiple providers', async () => {
            let callCount = 0;
            fetchSubscriptionWithFormat.mockImplementation((url) => {
                callCount++;
                return Promise.resolve({
                    content: mockClashYaml,
                    format: 'clash',
                    url: url
                });
            });

            const builder = new ClashConfigBuilder(
                'https://example.com/sub1\nhttps://example.com/sub2',
                [],
                [],
                null,
                'zh-CN',
                'test-agent'
            );
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            // Should have two proxy-providers
            expect(config['proxy-providers']).toBeDefined();
            expect(Object.keys(config['proxy-providers'])).toHaveLength(2);
            expect(config['proxy-providers'].provider1).toBeDefined();
            expect(config['proxy-providers'].provider2).toBeDefined();
        });
    });
});
