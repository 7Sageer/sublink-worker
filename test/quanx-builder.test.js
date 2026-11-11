import { describe, it, expect } from 'vitest';
import { QuanxConfigBuilder } from '../src/builders/QuanxConfigBuilder.js';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const UUID = '23ad6b10-8d1a-40f7-8ad0-e3e35cd32291';

const vmessWs = 'vmess://' + btoa(JSON.stringify({
    v: '2', ps: 'HK-vmess', add: 'hk.example.com', port: '443', id: UUID, aid: '0',
    net: 'ws', type: 'none', host: 'hk.example.com', path: '/ws', tls: 'tls', sni: 'hk.example.com'
}));

const INPUT = [
    'ss://' + btoa('aes-256-gcm:pass') + '@1.2.3.4:8388#JP-SS',
    vmessWs,
    `vless://${UUID}@5.6.7.8:443?encryption=none&security=reality&type=tcp&sni=www.apple.com&fp=chrome&pbk=PUBKEY&sid=0123abcd&flow=xtls-rprx-vision#US-VLESS`,
    'trojan://pwd@tj.example.com:443?sni=tj.example.com#SG,Trojan',
    'anytls://pw@at.example.com:443?sni=at.example.com&insecure=1#JP-AnyTLS',
    'hysteria2://pw@hy.example.com:8443?sni=hy.example.com#US-HY2',
    `vless://${UUID}@g.example.com:443?security=tls&type=grpc&serviceName=x#grpc-node`
].join('\n');

function section(config, name) {
    const match = config.match(new RegExp(`\\[${name}\\]\\n([\\s\\S]*?)(?=\\n\\n\\[|\\n?$)`));
    return match ? match[1].split('\n').filter(Boolean) : [];
}

async function build(input = INPUT, options = {}) {
    const builder = new QuanxConfigBuilder(
        input,
        options.selectedRules ?? 'minimal',
        options.customRules ?? [],
        undefined,
        'en-US',
        'curl/7.74.0',
        options.groupByCountry ?? false
    );
    return builder.build();
}

describe('QuanxConfigBuilder', () => {
    it('converts supported protocols to Quantumult X server lines', async () => {
        const servers = section(await build(), 'server_local');

        expect(servers).toContain('shadowsocks=1.2.3.4:8388, method=aes-256-gcm, password=pass, udp-relay=true, tag=JP-SS');
        expect(servers).toContain(`vmess=hk.example.com:443, method=chacha20-poly1305, password=${UUID}, obfs=wss, obfs-host=hk.example.com, obfs-uri=/ws, tls-host=hk.example.com, tls-verification=true, aead=true, udp-relay=true, tag=HK-vmess`);
        expect(servers).toContain(`vless=5.6.7.8:443, method=none, password=${UUID}, obfs=over-tls, tls-host=www.apple.com, reality-base64-pubkey=PUBKEY, reality-hex-shortid=0123abcd, vless-flow=xtls-rprx-vision, udp-relay=true, tag=US-VLESS`);
        expect(servers).toContain('trojan=tj.example.com:443, password=pwd, over-tls=true, tls-host=tj.example.com, tls-verification=true, udp-relay=true, tag=SG，Trojan');
        expect(servers).toContain('anytls=at.example.com:443, password=pw, over-tls=true, tls-host=at.example.com, tls-verification=false, udp-relay=true, tag=JP-AnyTLS');
    });

    it('comments out unsupported proxies and keeps them out of policies', async () => {
        const config = await build();
        const servers = section(config, 'server_local');
        const policies = section(config, 'policy');

        expect(servers).toContain('# Unsupported by Quantumult X: US-HY2 - type hysteria2');
        expect(servers).toContain('# Unsupported by Quantumult X: grpc-node - transport grpc');
        expect(policies.join('\n')).not.toContain('US-HY2');
        expect(policies.join('\n')).not.toContain('grpc-node');
    });

    it('refuses values with commas instead of emitting a broken line', async () => {
        const good = 'ss://' + btoa('aes-256-gcm:pass') + '@1.2.3.4:8388#Good';
        const config = await build([good, 'ss://' + btoa('aes-256-gcm:pa,ss') + '@1.2.3.4:8388#Bad'].join('\n'));
        const servers = section(config, 'server_local');
        expect(servers).toEqual([
            'shadowsocks=1.2.3.4:8388, method=aes-256-gcm, password=pass, udp-relay=true, tag=Good',
            '# Unsupported by Quantumult X: Bad - password contains a comma or newline'
        ]);
    });

    it('emits valid policies referencing existing servers and builtin policies', async () => {
        const config = await build();
        const policies = section(config, 'policy');
        const serverTags = section(config, 'server_local')
            .filter(line => !line.startsWith('#'))
            .map(line => line.split('tag=').pop());
        const policyNames = policies.map(line => line.split('=')[1].split(',')[0].trim());
        const known = new Set([...serverTags, ...policyNames, 'direct', 'reject']);

        expect(policies[0]).toMatch(/^url-latency-benchmark=⚡ Auto Select, .*check-interval=600/);
        policies.forEach(line => {
            expect(line).toMatch(/^(static|url-latency-benchmark)=/);
            const members = line.split(',').slice(1).map(s => s.trim()).filter(s => !s.includes('='));
            members.forEach(member => expect(known.has(member)).toBe(true));
        });
        expect(policies.join('\n')).not.toMatch(/DIRECT|REJECT/);
    });

    it('routes rules through remote lists with the resource parser and ends with final', async () => {
        const config = await build(INPUT, {
            customRules: [{ name: 'MyRule', domain_suffix: 'foo.com', domain_keyword: 'bar', ip_cidr: '1.1.1.0/24,2001:db8::/32', src_ip_cidr: '10.0.0.1/32', site: 'github' }]
        });
        const general = section(config, 'general');
        const remote = section(config, 'filter_remote');
        const local = section(config, 'filter_local');

        expect(general.some(line => line.startsWith('resource_parser_url = https://'))).toBe(true);
        expect(remote[0]).toMatch(/geosite\/github\.conf, tag=geosite:github - MyRule, force-policy=MyRule, update-interval=86400, opt-parser=true, enabled=true$/);
        remote.forEach(line => expect(line).toContain('opt-parser=true'));
        // geosite lists must precede geoip lists
        const firstIp = remote.findIndex(line => line.includes('/geoip/'));
        expect(firstIp).toBeGreaterThan(-1);
        expect(remote.slice(firstIp).every(line => line.includes('/geoip/'))).toBe(true);

        expect(local).toEqual([
            'host-suffix, foo.com, MyRule',
            'host-keyword, bar, MyRule',
            'ip-cidr, 1.1.1.0/24, MyRule',
            'ip6-cidr, 2001:db8::/32, MyRule',
            '# source IP rules are not supported by Quantumult X, skipped: 10.0.0.1/32',
            'final, 🐟 Fall Back'
        ]);
    });

    it('builds country groups and points Node Select at them', async () => {
        const policies = section(await build(INPUT, { groupByCountry: true }), 'policy');
        expect(policies).toContain('url-latency-benchmark=🇯🇵 Japan, JP-SS, JP-AnyTLS, check-interval=600');
        const nodeSelect = policies.find(line => line.startsWith('static=🚀 Node Select'));
        expect(nodeSelect).toContain('🇯🇵 Japan');
        expect(nodeSelect).not.toContain('JP-SS');
    });

    it('deduplicates identical nodes and renames name collisions', async () => {
        const ss = 'ss://' + btoa('aes-256-gcm:pass') + '@1.2.3.4:8388#Same';
        const ss2 = 'ss://' + btoa('aes-256-gcm:other') + '@1.2.3.4:8388#Same';
        const servers = section(await build([ss, ss, ss2].join('\n')), 'server_local');
        expect(servers.map(line => line.split('tag=').pop())).toEqual(['Same', 'Same 2']);
    });

    it('keeps wss nodes whose Host header differs from the TLS SNI via tls-host', async () => {
        const vmess = 'vmess://' + btoa(JSON.stringify({
            v: '2', ps: 'Mismatch', add: 'a.example.com', port: '443', id: UUID, aid: '0',
            net: 'ws', host: 'cdn.example.com', path: '/ws', tls: 'tls', sni: 'a.example.com'
        }));
        const trojan = 'trojan://pwd@t.example.com:443?sni=t.example.com&type=ws&host=cdn.example.com&path=%2Fws#TJ-Mismatch';
        const config = await build([vmess, trojan].join('\n'));
        expect(section(config, 'server_local')).toEqual([
            `vmess=a.example.com:443, method=chacha20-poly1305, password=${UUID}, obfs=wss, obfs-host=cdn.example.com, obfs-uri=/ws, tls-host=a.example.com, tls-verification=true, aead=true, udp-relay=true, tag=Mismatch`,
            'trojan=t.example.com:443, password=pwd, obfs=wss, obfs-host=cdn.example.com, obfs-uri=/ws, tls-host=t.example.com, tls-verification=true, udp-relay=true, tag=TJ-Mismatch'
        ]);
    });

    it('keeps untrusted multiline values from injecting config lines', async () => {
        const input = JSON.stringify({
            outbounds: [
                { type: 'shadowsocks', tag: 'BadServer', server: 'a.com\n[mitm]', server_port: 1, method: 'aes-256-gcm', password: 'p' },
                { type: 'shadowsocks', tag: 'BadMethod', server: 'b.com', server_port: 1, method: 'x\n[mitm]\nhostname = *', password: 'p' },
                { type: 'shadowsocks', tag: 'Good', server: 'c.com', server_port: 1, method: 'aes-256-gcm', password: 'p' }
            ]
        });
        const config = await build(input);
        expect(config.match(/^\[mitm\]$/gm)).toHaveLength(1);
        expect(config).not.toMatch(/^hostname/m);
        expect(section(config, 'server_local')).toEqual([
            'shadowsocks=c.com:1, method=aes-256-gcm, password=p, udp-relay=true, tag=Good',
            '# Unsupported by Quantumult X: BadServer - server contains a delimiter',
            '# Unsupported by Quantumult X: BadMethod - cipher x [mitm] hostname = *'
        ]);
    });

    it('reads Sing-Box string plugin_opts', async () => {
        const input = JSON.stringify({
            outbounds: [
                { type: 'shadowsocks', tag: 'V2P', server: 'v.com', server_port: 443, method: 'aes-256-gcm', password: 'p', plugin: 'v2ray-plugin', plugin_opts: 'mode=websocket;tls;host=cdn.example.com;path=/ws' },
                { type: 'shadowsocks', tag: 'OBFS', server: 'o.com', server_port: 443, method: 'aes-256-gcm', password: 'p', plugin: 'obfs-local', plugin_opts: 'obfs=tls;obfs-host=bing.com' }
            ]
        });
        const servers = section(await build(input), 'server_local');
        expect(servers).toEqual([
            'shadowsocks=v.com:443, method=aes-256-gcm, password=p, obfs=wss, obfs-host=cdn.example.com, obfs-uri=/ws, udp-relay=true, tag=V2P',
            'shadowsocks=o.com:443, method=aes-256-gcm, password=p, obfs=tls, obfs-host=bing.com, udp-relay=true, tag=OBFS'
        ]);
    });

    it('treats Clash trojan without a tls key as TLS', async () => {
        const yaml = 'proxies:\n  - {name: CT, type: trojan, server: t.example.com, port: 443, password: p, sni: t.example.com}\n';
        expect(section(await build(yaml), 'server_local')).toEqual([
            'trojan=t.example.com:443, password=p, over-tls=true, tls-host=t.example.com, tls-verification=true, udp-relay=true, tag=CT'
        ]);
    });

    it('references custom rule policies by their literal name', async () => {
        const config = await build(INPUT, {
            customRules: [
                { name: 'Work.Proxy', domain_suffix: 'work.com', site: 'github' },
                { name: 'Google', domain_suffix: 'g.com' }
            ]
        });
        const policies = section(config, 'policy');
        expect(policies.some(line => line.startsWith('static=Work.Proxy, '))).toBe(true);
        expect(section(config, 'filter_local')).toContain('host-suffix, work.com, Work.Proxy');
        expect(section(config, 'filter_local')).toContain('host-suffix, g.com, Google');
        expect(section(config, 'filter_remote')[0]).toContain('force-policy=Work.Proxy,');
    });

    it('drops rules of a nameless custom rule instead of emitting a policy-less line', async () => {
        const config = await build(INPUT, { customRules: [{ name: '', domain_suffix: 'x.com', site: 'github' }] });
        expect(section(config, 'filter_local')).not.toContain('host-suffix, x.com, ');
        section(config, 'filter_local').forEach(line => expect(line).not.toMatch(/,\s*$/));
        expect(section(config, 'filter_remote').join('\n')).not.toContain('github.conf');
    });

    it('downgrades latency groups with a single node to static', async () => {
        const input = ['ss://' + btoa('aes-256-gcm:pass') + '@1.2.3.4:8388#JP-SS', 'hysteria2://pw@hy.example.com:8443#US-HY2'].join('\n');
        const policies = section(await build(input, { groupByCountry: true }), 'policy');
        expect(policies).toContain('static=⚡ Auto Select, JP-SS');
        expect(policies).toContain('static=🇯🇵 Japan, JP-SS');
        expect(policies.join('\n')).not.toContain('url-latency-benchmark');
    });

    it('maps the 3x-ui vision-udp443 flow to plain vision', async () => {
        const link = `vless://${UUID}@1.2.3.4:443?type=tcp&security=reality&pbk=PUBKEY&fp=chrome&sni=www.tesla.com&sid=a258&flow=xtls-rprx-vision-udp443#xui`;
        expect(section(await build(link), 'server_local')).toEqual([
            `vless=1.2.3.4:443, method=none, password=${UUID}, obfs=over-tls, tls-host=www.tesla.com, reality-base64-pubkey=PUBKEY, reality-hex-shortid=a258, vless-flow=xtls-rprx-vision, udp-relay=true, tag=xui`
        ]);
    });

    it('parses links carrying invisible characters from copy/paste', async () => {
        const link = `\u200bvless://${UUID}@1.2.3.4:443?encryption=none&fp=chrome&pbk=PUBKEY&security=reality&sid=c9c6&sni=vuejs.org&spx=%2Fa1&support-x25519mlkem768=true&type=tcp#sub\u2060-1`;
        expect(section(await build(link), 'server_local')).toEqual([
            `vless=1.2.3.4:443, method=none, password=${UUID}, obfs=over-tls, tls-host=vuejs.org, reality-base64-pubkey=PUBKEY, reality-hex-shortid=c9c6, udp-relay=true, tag=sub-1`
        ]);
    });

    it('lists unparsed input lines when nothing could be read', async () => {
        await expect(build('vmes://broken-link')).rejects.toThrow(/Not parsed:\n- unrecognized input: vmes:\/\/broken-link/);
    });

    it('refuses to build an all-direct profile when no node is QX compatible', async () => {
        const xhttp = 'vless://0e1f2a3b-1111-2222-3333-444455556666@1.2.3.4:443?type=xhttp&path=%2F&security=reality&pbk=abc&sni=a.com#xui-xhttp';
        await expect(build(xhttp)).rejects.toThrow(/No Quantumult X compatible nodes[\s\S]*xui-xhttp - transport xhttp/);
    });
});

describe('/quanx route', () => {
    const createTestApp = () => createApp({
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: console,
        config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
    });

    it('returns a Quantumult X profile', async () => {
        const app = createTestApp();
        const res = await app.request(`http://localhost/quanx?config=${encodeURIComponent(INPUT)}`);
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('[server_local]');
        expect(text).toContain('tag=JP-SS');
    });

    it('serves bare node lines with list=true', async () => {
        const res = await createTestApp().request(`http://localhost/quanx?list=true&config=${encodeURIComponent(INPUT)}`);
        expect(res.status).toBe(200);
        const lines = (await res.text()).trim().split('\n');
        expect(lines[0]).toBe('shadowsocks=1.2.3.4:8388, method=aes-256-gcm, password=pass, udp-relay=true, tag=JP-SS');
        expect(lines.every(line => /^(shadowsocks|vmess|vless|trojan|anytls)=|^# Unsupported/.test(line))).toBe(true);
    });

    it('answers 400 with reasons instead of an all-direct profile', async () => {
        const grpc = 'vless://0e1f2a3b-1111-2222-3333-444455556666@1.2.3.4:443?type=grpc&serviceName=x&security=reality&pbk=abc&sni=a.com#xui-grpc';
        for (const extra of ['', '&list=true']) {
            const res = await createTestApp().request(`http://localhost/quanx?config=${encodeURIComponent(grpc)}${extra}`);
            expect(res.status).toBe(400);
            expect(await res.text()).toContain('xui-grpc - transport grpc');
        }
    });

    it('fetches subscriptions with a Clash UA instead of curl or the QX app UA', async () => {
        const seen = [];
        const fetchMock = async (url, init) => {
            seen.push(init?.headers?.get?.('User-Agent'));
            return { ok: true, status: 200, text: async () => 'ss://' + btoa('aes-256-gcm:pass') + '@1.2.3.4:8388#JP-SS', headers: { get: () => null } };
        };
        const original = globalThis.fetch;
        globalThis.fetch = fetchMock;
        try {
            const res = await createTestApp().request(`http://localhost/quanx?config=${encodeURIComponent('https://sub.example.com/s')}`, {
                headers: { 'User-Agent': 'Quantumult%20X/1.5.5' }
            });
            expect(res.status).toBe(200);
        } finally {
            globalThis.fetch = original;
        }
        expect(seen).toEqual(['clash.meta']);
    });

    it('requires the config parameter', async () => {
        const res = await createTestApp().request('http://localhost/quanx');
        expect(res.status).toBe(400);
    });

    it('supports q/ short links', async () => {
        const app = createTestApp();
        const query = `?config=${encodeURIComponent(INPUT)}`;
        const code = await (await app.request(`http://localhost/shorten-v2?url=${encodeURIComponent('http://localhost/quanx' + query)}`)).text();

        const redirect = await app.request(`http://localhost/q/${code}`);
        expect(redirect.status).toBe(302);
        expect(redirect.headers.get('location')).toBe(`http://localhost/quanx${query}`);

        const resolved = await app.request(`http://localhost/resolve?url=${encodeURIComponent(`http://localhost/q/${code}`)}`);
        expect((await resolved.json()).originalUrl).toBe(`http://localhost/quanx${query}`);
    });
});

describe('Quantumult X base config', () => {
    const createTestApp = () => createApp({
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: console,
        config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
    });

    const USER_PROFILE = `; my profile
[general]
server_check_url = http://cp.cloudflare.com/generate_204
profile_img_url = http://example.com/a.png

[dns]
server = 8.8.8.8

[policy]
static=Old, direct

[filter_local]
host, evil.com, Old
final, Old

[rewrite_remote]
https://example.com/rewrite.snippet, tag=MyRewrite, enabled=true

[task_local]
0 9 * * * https://example.com/task.js, tag=Task, enabled=true

[mitm]
hostname = *.example.com
`;

    it('saves an INI profile and applies it to /quanx via configId', async () => {
        const app = createTestApp();
        const save = await app.request('http://localhost/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'quanx', content: USER_PROFILE })
        });
        expect(save.status).toBe(200);
        const configId = await save.text();
        expect(configId).toMatch(/^quanx_/);

        const res = await app.request(`http://localhost/quanx?config=${encodeURIComponent(INPUT)}&configId=${configId}`);
        expect(res.status).toBe(200);
        const text = await res.text();
        const general = section(text, 'general');

        // user keys win, defaults the user omitted are kept
        expect(general).toContain('server_check_url = http://cp.cloudflare.com/generate_204');
        expect(general).not.toContain('server_check_url = http://www.gstatic.com/generate_204');
        expect(general).toContain('profile_img_url = http://example.com/a.png');
        expect(general.some(line => line.startsWith('resource_parser_url = '))).toBe(true);

        expect(section(text, 'dns')).toEqual(['server = 8.8.8.8']);
        expect(section(text, 'rewrite_remote')).toEqual(['https://example.com/rewrite.snippet, tag=MyRewrite, enabled=true']);
        expect(section(text, 'task_local')).toEqual(['0 9 * * * https://example.com/task.js, tag=Task, enabled=true']);
        expect(section(text, 'mitm')).toEqual(['hostname = *.example.com']);

        // generated sections are never taken from the base config
        expect(text).not.toContain('static=Old');
        expect(text).not.toContain('evil.com');
        expect(section(text, 'server_local').some(line => line.endsWith('tag=JP-SS'))).toBe(true);
        expect(text.match(/^\[general\]$/gm)).toHaveLength(1);
    });

    it('rejects content without any [section]', async () => {
        const res = await createTestApp().request('http://localhost/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'quanx', content: 'just some text' })
        });
        expect(res.status).toBe(400);
    });

    it('ignores configIds saved for other clients', async () => {
        const app = createTestApp();
        const save = await app.request('http://localhost/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'clash', content: 'port: 7890' })
        });
        const configId = await save.text();
        const text = await (await app.request(`http://localhost/quanx?config=${encodeURIComponent(INPUT)}&configId=${configId}`)).text();
        expect(section(text, 'general').some(line => line.startsWith('resource_parser_url = '))).toBe(true);
        expect(text).not.toContain('7890');
    });
});

describe('Quantumult X base config parsing', () => {
    it('normalizes object payloads like INI text', async () => {
        const { normalizeQuanxConfig } = await import('../src/utils/quanxConfigParser.js');
        const parsed = normalizeQuanxConfig({
            sections: { ' Policy ': ['static=X, direct'], rewrite_local: ['a\n[filter_local]\nfinal, direct'] }
        });
        expect(Object.keys(parsed.sections).sort()).toEqual(['filter_local', 'policy', 'rewrite_local']);
        expect(parsed.sections.rewrite_local).toEqual(['a']);
    });

    it('recognizes headers with trailing comments and keeps __proto__ inert', async () => {
        const { parseQuanxIni } = await import('../src/utils/quanxConfigParser.js');
        const parsed = parseQuanxIni('[mitm] ; certs\nhostname = a.com\n[__proto__]\nx');
        expect(parsed.sections.mitm).toEqual(['hostname = a.com']);
        const builder = new QuanxConfigBuilder(INPUT, 'minimal', [], JSON.parse(JSON.stringify(parsed)), 'en-US', 'curl/7.74.0', false);
        const config = await builder.build();
        expect(section(config, 'mitm')).toEqual(['hostname = a.com']);
        expect(section(config, 'policy').length).toBeGreaterThan(0);
    });
});
