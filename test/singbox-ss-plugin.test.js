import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { parseShadowsocks } from '../src/parsers/protocols/shadowsocksParser.js';

const userinfo = btoa('aes-128-gcm:pw');
const ss = (port, plugin, name) =>
    `ss://${userinfo}@1.2.3.4:${port}?plugin=${encodeURIComponent(plugin)}#${name}`;

async function shadowsocksOutbounds(input) {
    const builder = new SingboxConfigBuilder(input, [], [], null, 'en-US', 'test', false, false, undefined, undefined, '1.14');
    const config = await builder.build();
    return Object.fromEntries(config.outbounds.filter(o => o.type === 'shadowsocks').map(o => [o.tag, o]));
}

// sing-box rejects an object plugin_opts, which failed the whole config (#409).
describe('sing-box shadowsocks plugins', () => {
    it('emits SIP003 option strings with sing-box plugin names', async () => {
        const out = await shadowsocksOutbounds([
            ss(1, 'simple-obfs;obfs=http;obfs-host=a.com', 'OBFS'),
            ss(2, 'obfs-local;obfs=tls;obfs-host=a.com', 'OBFS-LOCAL'),
            ss(3, 'v2ray-plugin;mode=websocket;tls;host=a.com;path=/ws', 'V2RAY'),
        ].join('\n'));

        expect(out.OBFS).toMatchObject({ plugin: 'obfs-local', plugin_opts: 'obfs=http;obfs-host=a.com' });
        expect(out['OBFS-LOCAL']).toMatchObject({ plugin: 'obfs-local', plugin_opts: 'obfs=tls;obfs-host=a.com' });
        expect(out.V2RAY).toMatchObject({ plugin: 'v2ray-plugin', plugin_opts: 'mode=websocket;tls;host=a.com;path=/ws' });
    });

    it('translates Clash plugin-opts, keeping false flags meaningful', async () => {
        const out = await shadowsocksOutbounds(yaml.dump({
            proxies: [{
                name: 'Y', type: 'ss', server: '1.2.3.4', port: 1, cipher: 'aes-128-gcm', password: 'pw',
                plugin: 'v2ray-plugin',
                'plugin-opts': { mode: 'websocket', host: 'a.com', path: '/a;b', tls: false, mux: false, headers: { X: '1' } },
            }],
        }));
        expect(out.Y.plugin_opts).toBe(String.raw`mode=websocket;host=a.com;path=/a\;b;mux=0`);
    });

    it('drops only nodes whose plugin sing-box lacks', async () => {
        const out = await shadowsocksOutbounds([
            ss(1, 'shadow-tls;host=a.com', 'SHADOW-TLS'),
            `ss://${userinfo}@1.2.3.4:2#PLAIN`,
        ].join('\n'));
        expect(Object.keys(out)).toEqual(['PLAIN']);
    });
});

// Mihomo silently ignores SIP003 plugin names and connects without obfuscation.
it('normalizes SIP003 obfs plugin names to Clash naming', () => {
    expect(parseShadowsocks(ss(1, 'obfs-local;obfs=http', 'n')).plugin).toBe('obfs');
    expect(parseShadowsocks(ss(1, 'simple-obfs;obfs=http', 'n')).plugin).toBe('obfs');
});

// sing-box JSON input carries SIP003 spellings; Mihomo rejects a string plugin-opts.
describe('sing-box JSON input with shadowsocks plugins', () => {
    const input = JSON.stringify({
        outbounds: [{
            type: 'shadowsocks', tag: 'SB', server: '1.2.3.4', server_port: 1, method: 'aes-128-gcm', password: 'pw',
            plugin: 'obfs-local', plugin_opts: 'obfs=http;obfs-host=a.com'
        }]
    });

    it('converts to Clash plugin name and plugin-opts map', async () => {
        const { ClashConfigBuilder } = await import('../src/builders/ClashConfigBuilder.js');
        const config = yaml.load(await new ClashConfigBuilder(input, [], [], null, 'en-US', 'clash.meta').build());
        expect(config.proxies[0]).toMatchObject({ plugin: 'obfs', 'plugin-opts': { mode: 'http', host: 'a.com' } });
    });

    it('round-trips to sing-box unchanged', async () => {
        const out = await shadowsocksOutbounds(input);
        expect(out.SB).toMatchObject({ plugin: 'obfs-local', plugin_opts: 'obfs=http;obfs-host=a.com' });
    });
});
