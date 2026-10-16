import { describe, it, expect, vi, afterEach } from 'vitest';
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
import { CLASH_CONFIG, SING_BOX_CONFIG, SING_BOX_CONFIG_V1_11 } from '../src/config/index.js';

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
            const providerName = Object.keys(config['proxy-providers'])[0];
            expect(providerName).toMatch(/^_auto_provider_[a-z0-9]+$/);
            expect(config['proxy-providers'][providerName].url).toBe('https://example.com/clash-sub?token=xxx');
            expect(config['proxy-providers'][providerName].type).toBe('http');
            expect(config['proxy-providers'][providerName].path).toBe(`./proxy_providers/${providerName}.yaml`);

            // proxy-groups should have 'use' field
            const nodeSelect = config['proxy-groups'].find(g => g.name === '🚀 节点选择');
            expect(nodeSelect.use).toContain(providerName);
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
        it.each(['1.11', '1.12', '1.14'])('should inline Sing-Box subscriptions for version %s (issue #435)', async (version) => {
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: mockSingboxJson,
                format: 'singbox',
                url: 'https://example.com/singbox-sub',
                subscriptionUserinfo: 'upload=1; download=2; total=100'
            });

            const builder = new SingboxConfigBuilder(
                'https://example.com/singbox-sub',
                [],
                [],
                version === '1.11' ? SING_BOX_CONFIG_V1_11 : SING_BOX_CONFIG,
                'zh-CN',
                'test-agent',
                false,
                false,
                null,
                null,
                version
            );
            const config = await builder.build();

            expect(config).not.toHaveProperty('outbound_providers');
            config.outbounds.forEach(outbound => expect(outbound).not.toHaveProperty('providers'));
            expect(config.outbounds.filter(outbound => outbound.server)).toEqual(JSON.parse(mockSingboxJson).outbounds);
            expect(builder.getSubscriptionUserinfo()).toBe('upload=1; download=2; total=100');

            const nodeSelect = config.outbounds.find(o => o.tag === '🚀 节点选择');
            const autoSelect = config.outbounds.find(o => o.type === 'urltest');
            expect(nodeSelect.outbounds).toEqual(expect.arrayContaining(['SS-HK', 'SS-JP']));
            expect(autoSelect.outbounds).toEqual(['SS-HK', 'SS-JP']);
        });

        it.each(['1.11', '1.12', '1.14'])('should accept a remote route without rules for version %s', async (version) => {
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: JSON.stringify({
                    ...JSON.parse(mockSingboxJson),
                    route: { final: 'service' },
                    outbounds: [
                        ...JSON.parse(mockSingboxJson).outbounds,
                        { type: 'selector', tag: 'service', outbounds: ['SS-HK'] }
                    ]
                }),
                format: 'singbox',
                url: 'https://example.com/singbox-sub'
            });
            const builder = new SingboxConfigBuilder(
                'https://example.com/singbox-sub', [], [],
                version === '1.11' ? SING_BOX_CONFIG_V1_11 : SING_BOX_CONFIG,
                'zh-CN', 'test-agent', false, false, null, null, version
            );
            const config = await builder.build();

            expect(Array.isArray(config.route.rules)).toBe(true);
            expect(config.outbounds.find(outbound => outbound.tag === 'service').outbounds).toEqual(['SS-HK']);
        });

        it.each([false, true])('should preserve nested remote groups regardless of input order (reversed: %s)', async (reversed) => {
            const groups = [
                { type: 'selector', tag: 'entry', outbounds: ['service'] },
                { type: 'selector', tag: 'service', outbounds: ['latency'] },
                {
                    type: 'urltest', tag: 'latency', outbounds: ['SS-HK', 'SS-JP'],
                    url: 'https://latency.example.test/check', interval: '10m'
                }
            ];
            const routeRule = { domain_suffix: ['example.test'], outbound: 'entry' };
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: JSON.stringify({
                    route: { rules: [routeRule] },
                    outbounds: [...JSON.parse(mockSingboxJson).outbounds, ...(reversed ? groups.reverse() : groups)]
                }),
                format: 'singbox',
                url: 'https://example.com/singbox-sub'
            });
            const builder = new SingboxConfigBuilder('https://example.com/singbox-sub', [], [], null, 'zh-CN', 'test-agent');
            const config = await builder.build();

            expect(config.route.rules).toContainEqual(routeRule);
            expect(config.outbounds.find(outbound => outbound.tag === 'entry').outbounds).toEqual(['service']);
            expect(config.outbounds.find(outbound => outbound.tag === 'service').outbounds).toEqual(['latency']);
            expect(config.outbounds.find(outbound => outbound.tag === 'latency')).toMatchObject({
                type: 'urltest', outbounds: ['SS-HK', 'SS-JP'],
                url: 'https://latency.example.test/check', interval: '600s'
            });
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
            const providerNames = Object.keys(config['proxy-providers']);
            expect(providerNames).toHaveLength(2);
            expect(new Set(providerNames).size).toBe(2);
            expect(providerNames.every(name => name.startsWith('_auto_provider_'))).toBe(true);

            const nodeSelect = config['proxy-groups'].find(g => g.name === '🚀 节点选择');
            expect(nodeSelect.use).toEqual(expect.arrayContaining(providerNames));
        });

        it('should generate distinct stable Clash provider paths across separate builds', async () => {
            fetchSubscriptionWithFormat.mockImplementation((url) => Promise.resolve({
                content: mockClashYaml,
                format: 'clash',
                url
            }));

            const firstBuilder = new ClashConfigBuilder(
                'https://provider-a.example.com/sub?token=aaa',
                [],
                [],
                null,
                'zh-CN',
                'test-agent'
            );
            const secondBuilder = new ClashConfigBuilder(
                'https://provider-b.example.com/sub?token=bbb',
                [],
                [],
                null,
                'zh-CN',
                'test-agent'
            );

            const firstConfig = yaml.load(await firstBuilder.build());
            const secondConfig = yaml.load(await secondBuilder.build());
            const firstProviderName = Object.keys(firstConfig['proxy-providers'])[0];
            const secondProviderName = Object.keys(secondConfig['proxy-providers'])[0];
            const firstProvider = firstConfig['proxy-providers'][firstProviderName];
            const secondProvider = secondConfig['proxy-providers'][secondProviderName];

            expect(firstProviderName).not.toBe(secondProviderName);
            expect(firstProvider.path).not.toBe(secondProvider.path);
            expect(firstProvider.path).toBe(`./proxy_providers/${firstProviderName}.yaml`);
            expect(secondProvider.path).toBe(`./proxy_providers/${secondProviderName}.yaml`);
        });

        it('should keep Clash provider name stable for the same URL', async () => {
            fetchSubscriptionWithFormat.mockImplementation((url) => Promise.resolve({
                content: mockClashYaml,
                format: 'clash',
                url
            }));

            const buildProviderName = async () => {
                const builder = new ClashConfigBuilder(
                    'https://stable.example.com/sub?token=same',
                    [],
                    [],
                    null,
                    'zh-CN',
                    'test-agent'
                );
                const config = yaml.load(await builder.build());
                return Object.keys(config['proxy-providers'])[0];
            };

            const first = await buildProviderName();
            const second = await buildProviderName();
            expect(first).toBe(second);
        });

        it('should inline and merge nodes from multiple Sing-Box subscriptions', async () => {
            fetchSubscriptionWithFormat.mockImplementation((url) => Promise.resolve({
                content: JSON.stringify({
                    outbounds: [{
                        ...JSON.parse(mockSingboxJson).outbounds[0],
                        tag: new URL(url).hostname,
                        server: new URL(url).hostname
                    }]
                }),
                format: 'singbox',
                url
            }));

            const builder = new SingboxConfigBuilder(
                'https://provider-a.example.com/singbox\nhttps://provider-b.example.com/singbox',
                [],
                [],
                null,
                'zh-CN',
                'test-agent'
            );

            const config = await builder.build();
            expect(config).not.toHaveProperty('outbound_providers');
            expect(config.outbounds.filter(outbound => outbound.server).map(outbound => outbound.tag))
                .toEqual(['provider-a.example.com', 'provider-b.example.com']);
            const autoSelect = config.outbounds.find(outbound => outbound.type === 'urltest');
            expect(autoSelect.outbounds).toEqual(['provider-a.example.com', 'provider-b.example.com']);
        });
    });

    describe('Config Merge Behaviors', () => {
        it('should not override user-defined Clash providers when auto providers exist', async () => {
            fetchSubscriptionWithFormat.mockResolvedValue({
                content: mockClashYaml,
                format: 'clash',
                url: 'https://auto.example.com/clash-sub'
            });

            const baseConfig = JSON.parse(JSON.stringify(CLASH_CONFIG));
            baseConfig['proxy-providers'] = {
                provider1: {
                    type: 'http',
                    url: 'https://user.example.com/sub',
                    path: './user.yaml',
                    interval: 3600
                }
            };

            const builder = new ClashConfigBuilder(
                'https://auto.example.com/clash-sub',
                [],
                [],
                baseConfig,
                'zh-CN',
                'test-agent'
            );
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            expect(config['proxy-providers']).toBeDefined();
            expect(config['proxy-providers'].provider1?.url).toBe('https://user.example.com/sub');
            const autoProviderName = Object.keys(config['proxy-providers'])
                .find(name => name.startsWith('_auto_provider_'));
            expect(config['proxy-providers'][autoProviderName]?.url).toBe('https://auto.example.com/clash-sub');

            const nodeSelect = config['proxy-groups'].find(g => g.name === '🚀 节点选择');
            expect(nodeSelect.use).toContain('provider1');
            expect(nodeSelect.use).toContain(autoProviderName);
        });

        it.each(['base', 'subscription', 'inline'])('should strip fork-only Sing-Box provider fields from %s configs', async (source) => {
            const providerConfig = {
                outbound_providers: [{
                    tag: 'user-provider',
                    type: 'http',
                    download_url: 'https://user.example.com/sub',
                    path: './providers/user.json',
                    download_interval: '24h'
                }],
                outbounds: [
                    ...JSON.parse(mockSingboxJson).outbounds,
                    { type: 'selector', tag: 'custom-selector', outbounds: ['SS-HK'], providers: ['user-provider'] },
                    { type: 'urltest', tag: 'custom-urltest', outbounds: ['SS-JP'], providers: ['user-provider'] }
                ]
            };
            const baseConfig = JSON.parse(JSON.stringify(SING_BOX_CONFIG));
            const content = source === 'base' ? mockSingboxJson : JSON.stringify(providerConfig);
            if (source === 'base') Object.assign(baseConfig, providerConfig);
            fetchSubscriptionWithFormat.mockResolvedValue({
                content,
                format: 'singbox',
                url: 'https://auto.example.com/singbox-sub'
            });

            const builder = new SingboxConfigBuilder(
                source === 'inline' ? content : 'https://auto.example.com/singbox-sub',
                [],
                [],
                baseConfig,
                'zh-CN',
                'test-agent'
            );
            const config = await builder.build();

            expect(config).not.toHaveProperty('outbound_providers');
            config.outbounds.forEach(outbound => expect(outbound).not.toHaveProperty('providers'));
            expect(config.outbounds.filter(outbound => outbound.server)).toHaveLength(2);
            expect(config.outbounds.find(outbound => outbound.tag === 'custom-selector').outbounds).toContain('SS-HK');
            expect(config.outbounds.find(outbound => outbound.tag === 'custom-urltest').outbounds).toContain('SS-JP');
            expect(providerConfig.outbound_providers).toHaveLength(1);
            expect(providerConfig.outbounds.at(-1).providers).toEqual(['user-provider']);
        });

        it('should ignore Clash provider references when merging Sing-Box groups', async () => {
            const content = yaml.dump({
                ...yaml.load(mockClashYaml),
                'proxy-groups': [
                    { name: '🚀 节点选择', type: 'select', proxies: ['HK-Node'], use: ['clash-provider'] },
                    { name: 'custom-group', type: 'select', proxies: ['JP-Node', 'provider-only-group'], use: ['clash-provider'] },
                    { name: 'provider-only-group', type: 'select', use: ['clash-provider'] }
                ]
            });
            const builder = new SingboxConfigBuilder(content, [], [], null, 'zh-CN', 'test-agent');
            const config = await builder.build();

            config.outbounds.forEach(outbound => expect(outbound).not.toHaveProperty('providers'));
            expect(config.outbounds.find(outbound => outbound.tag === 'custom-group').outbounds).toEqual(['JP-Node']);
            expect(config.outbounds.some(outbound => outbound.tag === 'provider-only-group')).toBe(false);
        });
    });
});
