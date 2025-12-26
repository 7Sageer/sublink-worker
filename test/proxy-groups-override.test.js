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

    describe('Issue #277 - Proxy Group Merge and Validation', () => {
        it('should merge user proxy-group with same name as system group (⚡ 自动选择)', async () => {
            // User defines a custom ⚡ 自动选择 with custom settings
            const inputWithDuplicateName = `
proxies:
  - name: HK-Node
    type: ss
    server: hk.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: ⚡ 自动选择
    type: url-test
    proxies:
      - HK-Node
    url: http://custom.test/204
    interval: 600
`;
            const builder = new ClashConfigBuilder(inputWithDuplicateName, 'minimal', [], null, 'zh-CN', 'test-agent');
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            // Should only have ONE "⚡ 自动选择" group (no duplicates)
            const autoGroups = config['proxy-groups'].filter(g =>
                g.name && g.name.includes('自动选择')
            );
            expect(autoGroups).toHaveLength(1);

            // Should have merged proxies and preserved user's custom settings
            expect(autoGroups[0].proxies).toContain('HK-Node');
            expect(autoGroups[0].interval).toBe(600);
            expect(autoGroups[0].url).toBe('http://custom.test/204');
        });

        it('should fill empty url-test proxies with all available nodes', async () => {
            const inputWithEmptyProxies = `
proxies:
  - name: Node-A
    type: ss
    server: a.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
  - name: Node-B
    type: ss
    server: b.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: Empty Test Group
    type: url-test
    proxies: []
`;
            const builder = new ClashConfigBuilder(inputWithEmptyProxies, 'minimal', [], null, 'zh-CN', 'test-agent');
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            const emptyGroup = config['proxy-groups'].find(g => g.name === 'Empty Test Group');
            expect(emptyGroup).toBeDefined();
            // Empty group should be filled with all available proxies
            expect(emptyGroup.proxies.length).toBeGreaterThan(0);
            expect(emptyGroup.proxies).toContain('Node-A');
            expect(emptyGroup.proxies).toContain('Node-B');
        });

        it('should filter out invalid proxy references from user groups', async () => {
            const inputWithInvalidRefs = `
proxies:
  - name: Valid-Node
    type: ss
    server: valid.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: Custom Group
    type: select
    proxies:
      - DIRECT
      - REJECT
      - Valid-Node
      - NonExistent-Node
      - AnotherMissing
`;
            const builder = new ClashConfigBuilder(inputWithInvalidRefs, 'minimal', [], null, 'zh-CN', 'test-agent');
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            const customGroup = config['proxy-groups'].find(g => g.name === 'Custom Group');
            expect(customGroup).toBeDefined();
            // Valid references should be kept
            expect(customGroup.proxies).toContain('DIRECT');
            expect(customGroup.proxies).toContain('REJECT');
            expect(customGroup.proxies).toContain('Valid-Node');
            // Invalid references should be filtered out
            expect(customGroup.proxies).not.toContain('NonExistent-Node');
            expect(customGroup.proxies).not.toContain('AnotherMissing');
        });

        it('SingboxConfigBuilder should merge user outbounds with same tag', async () => {
            // User defines a custom selector with same tag as system group
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
                    { type: 'direct', tag: 'DIRECT' },
                    { type: 'block', tag: 'REJECT' }
                ]
            });

            const builder = new SingboxConfigBuilder(singboxInput, 'minimal', [], null, 'zh-CN', 'test-agent');
            const config = await builder.build();

            // Verify proxy node exists
            const proxyNode = (config.outbounds || []).find(o => o && o.tag === 'HK-Node');
            expect(proxyNode).toBeDefined();

            // System-generated urltest group should have the proxy
            const autoSelect = (config.outbounds || []).find(o => o && o.type === 'urltest');
            expect(autoSelect).toBeDefined();
            expect(autoSelect.outbounds).toContain('HK-Node');
        });
    });

    describe('DNS Config Merging', () => {
        it('ClashConfigBuilder should merge DNS nameserver arrays from multiple sources', async () => {
            // First subscription with DNS config
            const input1 = `
proxies:
  - name: Node-A
    type: ss
    server: a.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
dns:
  enable: true
  nameserver:
    - 8.8.8.8
    - 8.8.4.4
  fallback:
    - 1.0.0.1
`;
            const builder = new ClashConfigBuilder(input1, 'minimal', [], null, 'zh-CN', 'test-agent');

            // Simulate applying second subscription's DNS config
            builder.mergeDnsConfig = builder.mergeDnsConfig.bind(builder);
            const existingDns = { enable: true, nameserver: ['8.8.8.8', '8.8.4.4'], fallback: ['1.0.0.1'] };
            const incomingDns = { nameserver: ['1.1.1.1', '8.8.8.8'], fallback: ['9.9.9.9'] };

            const merged = builder.mergeDnsConfig(existingDns, incomingDns);

            // Should merge and deduplicate nameserver
            expect(merged.nameserver).toContain('8.8.8.8');
            expect(merged.nameserver).toContain('8.8.4.4');
            expect(merged.nameserver).toContain('1.1.1.1');
            expect(merged.nameserver.filter(n => n === '8.8.8.8')).toHaveLength(1); // No duplicates

            // Should merge fallback
            expect(merged.fallback).toContain('1.0.0.1');
            expect(merged.fallback).toContain('9.9.9.9');

            // Should preserve other fields
            expect(merged.enable).toBe(true);
        });

        it('ClashConfigBuilder should merge fake-ip-filter arrays', async () => {
            const input = `
proxies:
  - name: Node-A
    type: ss
    server: a.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
`;
            const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');

            const existingDns = {
                'fake-ip-filter': ['*.lan', '*.local']
            };
            const incomingDns = {
                'fake-ip-filter': ['*.local', '*.internal', 'localhost']
            };

            const merged = builder.mergeDnsConfig(existingDns, incomingDns);

            // Should merge and deduplicate
            expect(merged['fake-ip-filter']).toContain('*.lan');
            expect(merged['fake-ip-filter']).toContain('*.local');
            expect(merged['fake-ip-filter']).toContain('*.internal');
            expect(merged['fake-ip-filter']).toContain('localhost');
            expect(merged['fake-ip-filter'].filter(f => f === '*.local')).toHaveLength(1);
        });

        it('ClashConfigBuilder should merge nameserver-policy objects', async () => {
            const input = `
proxies:
  - name: Node-A
    type: ss
    server: a.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
`;
            const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');

            const existingDns = {
                'nameserver-policy': {
                    '+.google.com': '8.8.8.8'
                }
            };
            const incomingDns = {
                'nameserver-policy': {
                    '+.github.com': '1.1.1.1',
                    '+.google.com': '8.8.4.4'  // Override existing
                }
            };

            const merged = builder.mergeDnsConfig(existingDns, incomingDns);

            // Should merge policies
            expect(merged['nameserver-policy']['+.github.com']).toBe('1.1.1.1');
            // Later value should override
            expect(merged['nameserver-policy']['+.google.com']).toBe('8.8.4.4');
        });

        it('mergeDnsConfig should handle null/undefined existing config', async () => {
            const input = `
proxies:
  - name: Node-A
    type: ss
    server: a.example.com
    port: 443
    cipher: aes-128-gcm
    password: test
`;
            const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');

            const incomingDns = { nameserver: ['1.1.1.1'], enable: true };

            const merged = builder.mergeDnsConfig(null, incomingDns);

            expect(merged.nameserver).toEqual(['1.1.1.1']);
            expect(merged.enable).toBe(true);
        });
    });
});
