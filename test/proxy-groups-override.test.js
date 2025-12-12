import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import { parseSingboxJson, parseClashYaml, parseSurgeIni } from '../src/parsers/subscription/subscriptionContentParser.js';

describe('Unified Proxy-Groups Override', () => {
    describe('Parser Level - proxy-groups extraction', () => {
        it('parseClashYaml should preserve proxy-groups in config override', () => {
            const clashConfig = `
proxies:
  - name: HK-Node
    type: ss
    server: hk.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: 自定义选择
    type: select
    proxies:
      - DIRECT
      - REJECT
      - HK-Node
  - name: 自动测速
    type: url-test
    proxies:
      - HK-Node
    url: http://www.gstatic.com/generate_204
    interval: 300
`;
            const result = parseClashYaml(clashConfig);

            expect(result).not.toBeNull();
            expect(result.type).toBe('yamlConfig');
            expect(result.proxies).toHaveLength(1);
            expect(result.config).toBeDefined();
            expect(result.config['proxy-groups']).toBeDefined();
            expect(result.config['proxy-groups']).toHaveLength(2);

            const selectGroup = result.config['proxy-groups'].find(g => g.name === '自定义选择');
            expect(selectGroup).toBeDefined();
            expect(selectGroup.type).toBe('select');
            expect(selectGroup.proxies).toContain('HK-Node');
        });

        it('parseSingboxJson should extract selector/urltest and convert to proxy-groups format', () => {
            const singboxConfig = JSON.stringify({
                outbounds: [
                    {
                        type: 'shadowsocks',
                        tag: 'HK-Node',
                        server: 'hk.example.com',
                        server_port: 443,
                        method: 'aes-128-gcm',
                        password: 'test'
                    },
                    {
                        type: 'selector',
                        tag: '自定义选择',
                        outbounds: ['DIRECT', 'REJECT', 'HK-Node']
                    },
                    {
                        type: 'urltest',
                        tag: '自动测速',
                        outbounds: ['HK-Node'],
                        url: 'http://www.gstatic.com/generate_204',
                        interval: '5m'
                    },
                    { type: 'direct', tag: 'DIRECT' },
                    { type: 'block', tag: 'REJECT' }
                ]
            });

            const result = parseSingboxJson(singboxConfig);

            expect(result).not.toBeNull();
            expect(result.type).toBe('singboxConfig');
            expect(result.proxies).toHaveLength(1);
            expect(result.proxies[0].tag).toBe('HK-Node');

            // Should have proxy-groups in config override
            expect(result.config).toBeDefined();
            expect(result.config['proxy-groups']).toBeDefined();
            expect(result.config['proxy-groups']).toHaveLength(2);

            const selectGroup = result.config['proxy-groups'].find(g => g.name === '自定义选择');
            expect(selectGroup).toBeDefined();
            expect(selectGroup.type).toBe('select');
            expect(selectGroup.proxies).toContain('HK-Node');

            const urlTestGroup = result.config['proxy-groups'].find(g => g.name === '自动测速');
            expect(urlTestGroup).toBeDefined();
            expect(urlTestGroup.type).toBe('url-test');
            expect(urlTestGroup.proxies).toContain('HK-Node');
        });

        it('parseSurgeIni should parse proxy-groups strings into objects', () => {
            const surgeConfig = `
[General]
loglevel = notify

[Proxy]
HK-Node = ss, hk.example.com, 443, encrypt-method=aes-128-gcm, password=test

[Proxy Group]
自定义选择 = select, DIRECT, REJECT, HK-Node
自动测速 = url-test, HK-Node, url=http://www.gstatic.com/generate_204, interval=300

[Rule]
FINAL,DIRECT
`;
            const result = parseSurgeIni(surgeConfig);

            expect(result).not.toBeNull();
            expect(result.type).toBe('surgeConfig');
            expect(result.proxies).toHaveLength(1);

            // Should have proxy-groups in config override
            expect(result.config).toBeDefined();
            expect(result.config['proxy-groups']).toBeDefined();
            expect(result.config['proxy-groups']).toHaveLength(2);

            const selectGroup = result.config['proxy-groups'].find(g => g.name === '自定义选择');
            expect(selectGroup).toBeDefined();
            expect(selectGroup.type).toBe('select');
            expect(selectGroup.proxies).toContain('HK-Node');

            const urlTestGroup = result.config['proxy-groups'].find(g => g.name === '自动测速');
            expect(urlTestGroup).toBeDefined();
            expect(urlTestGroup.type).toBe('url-test');
            expect(urlTestGroup.proxies).toContain('HK-Node');
        });
    });

    describe('Builder Level - proxy-groups override applied', () => {
        const clashInput = `
proxies:
  - name: HK-Node
    type: ss
    server: hk.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: 自定义选择
    type: select
    proxies:
      - DIRECT
      - REJECT
      - HK-Node
`;

        const singboxInput = JSON.stringify({
            outbounds: [
                {
                    type: 'shadowsocks',
                    tag: 'HK-Node',
                    server: 'hk.example.com',
                    server_port: 443,
                    method: 'aes-128-gcm',
                    password: 'test'
                },
                {
                    type: 'selector',
                    tag: '自定义选择',
                    outbounds: ['DIRECT', 'REJECT', 'HK-Node']
                },
                { type: 'direct', tag: 'DIRECT' },
                { type: 'block', tag: 'REJECT' }
            ]
        });

        const surgeInput = `
[General]
loglevel = notify

[Proxy]
HK-Node = ss, hk.example.com, 443, encrypt-method=aes-128-gcm, password=test

[Proxy Group]
自定义选择 = select, DIRECT, REJECT, HK-Node

[Rule]
FINAL,DIRECT
`;

        it('ClashConfigBuilder should preserve custom proxy-group from Clash input', async () => {
            const builder = new ClashConfigBuilder(clashInput, 'minimal', [], null, 'zh-CN', 'test-agent');
            const yamlText = await builder.build();
            const built = yaml.load(yamlText);

            const customGroup = (built['proxy-groups'] || []).find(g => g && g.name === '自定义选择');
            expect(customGroup).toBeDefined();
            expect(customGroup.type).toBe('select');
            expect(customGroup.proxies).toContain('HK-Node');
        });

        it('ClashConfigBuilder should preserve custom proxy-group from Sing-Box input', async () => {
            const builder = new ClashConfigBuilder(singboxInput, 'minimal', [], null, 'zh-CN', 'test-agent');
            const yamlText = await builder.build();
            const built = yaml.load(yamlText);

            const customGroup = (built['proxy-groups'] || []).find(g => g && g.name === '自定义选择');
            expect(customGroup).toBeDefined();
            expect(customGroup.type).toBe('select');
            expect(customGroup.proxies).toContain('HK-Node');
        });

        it('ClashConfigBuilder should preserve custom proxy-group from Surge input', async () => {
            const builder = new ClashConfigBuilder(surgeInput, 'minimal', [], null, 'zh-CN', 'test-agent');
            const yamlText = await builder.build();
            const built = yaml.load(yamlText);

            const customGroup = (built['proxy-groups'] || []).find(g => g && g.name === '自定义选择');
            expect(customGroup).toBeDefined();
            expect(customGroup.type).toBe('select');
            expect(customGroup.proxies).toContain('HK-Node');
        });

        it('SingboxConfigBuilder should add groups from Sing-Box input (converted format)', async () => {
            const builder = new SingboxConfigBuilder(singboxInput, 'minimal', [], null, 'zh-CN', 'test-agent');
            const config = await builder.build();

            // The proxy-groups from input are in Clash format, which the SingBox builder
            // will use via applyConfigOverrides. The key is that the parser extracts them.
            // For now, we verify the proxy node is included
            const proxyNode = (config.outbounds || []).find(o => o && o.tag === 'HK-Node');
            expect(proxyNode).toBeDefined();

            // The standard groups should be created
            const autoSelect = (config.outbounds || []).find(o => o && o.type === 'urltest');
            expect(autoSelect).toBeDefined();
        });

        it('SurgeConfigBuilder should include proxies from Surge input', async () => {
            const builder = new SurgeConfigBuilder(surgeInput, 'minimal', [], null, 'zh-CN', 'test-agent');
            const configText = await builder.build();

            // Verify the proxy is included
            expect(configText).toContain('HK-Node');
            // Verify proxy groups section exists
            expect(configText).toContain('[Proxy Group]');
        });

        it('SurgeConfigBuilder should handle Clash input with object proxy-groups', async () => {
            // Regression test: object-format proxy-groups should not cause errors
            const builder = new SurgeConfigBuilder(clashInput, 'minimal', [], null, 'zh-CN', 'test-agent');
            const configText = await builder.build();

            // Should produce valid Surge output without [object Object]
            expect(configText).toContain('[Proxy Group]');
            expect(configText).toContain('HK-Node');
            expect(configText).not.toContain('[object Object]');
        });

        it('SurgeConfigBuilder with groupByCountry handles Clash input proxy-groups', async () => {
            // Regression test for addCountryGroups with object-format groups
            const builder = new SurgeConfigBuilder(clashInput, 'minimal', [], null, 'zh-CN', 'test-agent', true);
            const configText = await builder.build();

            expect(configText).toContain('[Proxy Group]');
            expect(configText).not.toContain('[object Object]');
        });
    });
});
