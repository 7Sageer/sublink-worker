import { describe, it, expect, vi, afterEach } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { QuanxConfigBuilder } from '../src/builders/QuanxConfigBuilder.js';
import { convertQuanxProxyToObject } from '../src/parsers/convertQuanxProxyToObject.js';

const UUID = '00000000-a7d7-4154-b280-6e36d5941daa';
// Shape of a Sub-Store / miaomiaowu `?t=qx` node list
const QX_LIST = [
    'shadowsocks=115.0.0.1:18014,method=chacha20-ietf-poly1305,password=fake,udp-relay=true,tag=🇯🇵 nuro-家宽',
    'shadowsocks=hk.example.com:61870,method=2022-blake3-aes-256-gcm,password=AAAA=:BBBB=,udp-relay=true,tag=🇭🇰 vmiss·SS',
    `vless=hk.example.com:61850,method=none,password=${UUID},obfs=over-tls,tls-host=www.tesla.com,vless-flow=xtls-rprx-vision,udp-relay=true,tag=🇭🇰 vmiss,reality-base64-pubkey=PUBKEY,reality-hex-shortid=a258`,
    `vmess=v.example.com:443,method=chacha20-poly1305,password=${UUID},obfs=wss,obfs-host=cdn.example.com,obfs-uri=/ws,tls-host=v.example.com,aead=true,tag=VM`,
    'trojan=t.example.com:443,password=pwd,over-tls=true,tls-host=t.example.com,tls-verification=false,tag=TJ',
    'http=h.example.com:80,username=u,password=p,tag=HTTP-ignored'
].join('\n');

const servers = (config) => (config.match(/\[server_local\]\n([\s\S]*?)(?=\n\n\[|\n?$)/)?.[1] || '').split('\n').filter(Boolean);

describe('Quantumult X node lines as input', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('converts a QX node line into the internal object', () => {
        expect(convertQuanxProxyToObject(QX_LIST.split('\n')[2])).toMatchObject({
            type: 'vless', tag: '🇭🇰 vmiss', server: 'hk.example.com', server_port: 61850, uuid: UUID, udp: true,
            flow: 'xtls-rprx-vision',
            tls: { enabled: true, server_name: 'www.tesla.com', reality: { enabled: true, public_key: 'PUBKEY', short_id: 'a258' } }
        });
        expect(convertQuanxProxyToObject('Name = vmess, host, 443, username=x')).toBeNull();
        expect(convertQuanxProxyToObject('http=h.example.com:80,tag=x')).toBeNull();
    });

    it('feeds QX node lists into the Clash builder', async () => {
        const builder = new ClashConfigBuilder(QX_LIST, 'minimal', [], null, 'en-US', 'curl/7.74.0');
        const config = yaml.load(await builder.build());
        const byName = Object.fromEntries(config.proxies.map(p => [p.name, p]));
        expect(Object.keys(byName)).toEqual(['🇯🇵 nuro-家宽', '🇭🇰 vmiss·SS', '🇭🇰 vmiss', 'VM', 'TJ']);
        expect(byName['🇭🇰 vmiss']).toMatchObject({ type: 'vless', flow: 'xtls-rprx-vision', 'reality-opts': { 'public-key': 'PUBKEY', 'short-id': 'a258' } });
        expect(byName.VM).toMatchObject({ type: 'vmess', network: 'ws', tls: true, servername: 'v.example.com' });
        expect(byName.TJ).toMatchObject({ type: 'trojan', 'skip-cert-verify': true });
    });

    it('round-trips QX node lists through the QuanX builder', async () => {
        const builder = new QuanxConfigBuilder(QX_LIST, 'minimal', [], undefined, 'en-US', 'curl/7.74.0', false);
        const lines = servers(await builder.build());
        expect(lines).toContain(`vless=hk.example.com:61850, method=none, password=${UUID}, obfs=over-tls, tls-host=www.tesla.com, reality-base64-pubkey=PUBKEY, reality-hex-shortid=a258, vless-flow=xtls-rprx-vision, udp-relay=true, tag=🇭🇰 vmiss`);
        expect(lines).toContain('shadowsocks=hk.example.com:61870, method=2022-blake3-aes-256-gcm, password=AAAA=:BBBB=, udp-relay=true, tag=🇭🇰 vmiss·SS');
        expect(lines.length).toBe(5);
    });

    it('parses a fetched QX subscription', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => QX_LIST, headers: { get: () => null } })));
        const builder = new ClashConfigBuilder('https://sub.example.com/api?t=qx', 'minimal', [], null, 'en-US', 'curl/7.74.0');
        const config = yaml.load(await builder.build());
        expect(config.proxies).toHaveLength(5);
    });

    it('explains a fetched subscription that yields no nodes', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => '<html>login</html>', headers: { get: () => null } })));
        const builder = new QuanxConfigBuilder('https://sub.example.com/sub', 'minimal', [], undefined, 'en-US', 'curl/7.74.0', false);
        await expect(builder.build()).rejects.toThrow(/subscription returned no usable nodes: https:\/\/sub\.example\.com\/sub \(content starts with: <html>login<\/html>\)/);
    });
});
