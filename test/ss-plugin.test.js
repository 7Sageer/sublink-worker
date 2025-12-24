import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

/**
 * Test for GitHub Issue #290
 * SS proxies with plugin and plugin-opts should preserve these fields after conversion
 * https://github.com/7Sageer/sublink-worker/issues/290
 */
describe('SS Plugin Issue #290', () => {
  it('should preserve plugin and plugin-opts for SS proxies', async () => {
    const input = `proxies:
  - name: 🇭🇰香港
    type: ss
    server: xx.xxxx.com
    port: 99999
    cipher: aes-128-gcm
    password: xxxxxxx-xxxxxxxx-xxxx-xxxxxxx-xxxxxxxxxxxxx
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: xxxxxxxxxxxxxxxxxxxxxxxxxx.baidu.com`;

    const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    // Find the proxy in the output
    const proxy = built.proxies.find(p => p.name === '🇭🇰香港');

    expect(proxy).toBeDefined();
    expect(proxy.plugin).toBe('obfs');
    expect(proxy['plugin-opts']).toBeDefined();
    expect(proxy['plugin-opts'].mode).toBe('http');
    expect(proxy['plugin-opts'].host).toBe('xxxxxxxxxxxxxxxxxxxxxxxxxx.baidu.com');
  });

  it('should preserve v2ray-plugin with websocket mode', async () => {
    const input = `proxies:
  - name: SS-V2Ray-WS
    type: ss
    server: example.com
    port: 443
    cipher: chacha20-ietf-poly1305
    password: test-password
    plugin: v2ray-plugin
    plugin-opts:
      mode: websocket
      tls: true
      host: example.com
      path: /v2ray`;

    const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    const proxy = built.proxies.find(p => p.name === 'SS-V2Ray-WS');

    expect(proxy).toBeDefined();
    expect(proxy.plugin).toBe('v2ray-plugin');
    expect(proxy['plugin-opts']).toBeDefined();
    expect(proxy['plugin-opts'].mode).toBe('websocket');
    expect(proxy['plugin-opts'].tls).toBe(true);
    expect(proxy['plugin-opts'].host).toBe('example.com');
    expect(proxy['plugin-opts'].path).toBe('/v2ray');
  });

  it('should work without plugin fields', async () => {
    const input = `proxies:
  - name: SS-NoPlugin
    type: ss
    server: example.com
    port: 8388
    cipher: aes-256-gcm
    password: test-password`;

    const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    const proxy = built.proxies.find(p => p.name === 'SS-NoPlugin');

    expect(proxy).toBeDefined();
    expect(proxy.plugin).toBeUndefined();
    expect(proxy['plugin-opts']).toBeUndefined();
  });

  it('should preserve plugin and plugin-opts for SS proxies in inline YAML format (issue #290)', async () => {
    // This is the exact format from issue #290 - inline/flow style YAML
    const input = `proxies:
  - { name: 🇭🇰香港, type: ss, server: xx.xxxx.com, port: 99999, cipher: aes-128-gcm, password: xxxxxxx-xxxxxxxx-xxxx-xxxxxxx-xxxxxxxxxxxxx, udp: true, plugin: obfs, plugin-opts: { mode: http, host: xxxxxxxxxxxxxxxxxxxxxxxxxx.baidu.com } }`;

    const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    // Find the proxy in the output
    const proxy = built.proxies.find(p => p.name === '🇭🇰香港');

    expect(proxy).toBeDefined();
    expect(proxy.plugin).toBe('obfs');
    expect(proxy['plugin-opts']).toBeDefined();
    expect(proxy['plugin-opts'].mode).toBe('http');
    expect(proxy['plugin-opts'].host).toBe('xxxxxxxxxxxxxxxxxxxxxxxxxx.baidu.com');
  });

  it('should parse SS URL with simple-obfs plugin from query string', async () => {
    // Test SS URL with simple-obfs plugin in query string format
    // Base64 decoded: aes-128-gcm:test-password-1234
    const ssUrl = 'ss://YWVzLTEyOC1nY206dGVzdC1wYXNzd29yZC0xMjM0@test.example.com:8388/?plugin=simple-obfs%3Bobfs%3Dhttp%3Bobfs-host%3Dcdn.example.com#%F0%9F%87%AD%F0%9F%87%B0Test-Node';

    const builder = new ClashConfigBuilder(ssUrl, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    // Find the proxy in the output
    const proxy = built.proxies.find(p => p.name === '🇭🇰Test-Node');

    expect(proxy).toBeDefined();
    expect(proxy.type).toBe('ss');
    expect(proxy.server).toBe('test.example.com');
    expect(proxy.port).toBe(8388);
    expect(proxy.cipher).toBe('aes-128-gcm');
    expect(proxy.plugin).toBe('obfs');
    expect(proxy['plugin-opts']).toBeDefined();
    expect(proxy['plugin-opts'].mode).toBe('http');
    expect(proxy['plugin-opts'].host).toBe('cdn.example.com');
  });

  it('should parse SS URL with v2ray-plugin from query string', async () => {
    // v2ray-plugin format in URL
    const ssUrl = 'ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTp0ZXN0LXBhc3N3b3Jk@example.com:443/?plugin=v2ray-plugin%3Bmode%3Dwebsocket%3Bhost%3Dexample.com%3Bpath%3D%2Fv2ray%3Btls#SS-V2Ray-Test';

    const builder = new ClashConfigBuilder(ssUrl, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    const proxy = built.proxies.find(p => p.name === 'SS-V2Ray-Test');

    expect(proxy).toBeDefined();
    expect(proxy.plugin).toBe('v2ray-plugin');
    expect(proxy['plugin-opts']).toBeDefined();
    expect(proxy['plugin-opts'].mode).toBe('websocket');
    expect(proxy['plugin-opts'].host).toBe('example.com');
    expect(proxy['plugin-opts'].path).toBe('/v2ray');
    expect(proxy['plugin-opts'].tls).toBe(true);  // Boolean flag without value
  });
});
