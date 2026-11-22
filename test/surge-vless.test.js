import { afterEach, describe, expect, it, vi } from 'vitest';
import yaml from 'js-yaml';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import { ProxyParser } from '../src/parsers/ProxyParser.js';
import sourceProxies from './fixtures/surge-source-proxies.json';

const uuid = '00000000-0000-4000-8000-000000000001';
const publicKey = 'A'.repeat(43);
const fingerprint = '11'.repeat(32);
const node = (fields = {}) => ({ name: 'VLESS', type: 'vless', server: 'node.example.com', port: 443, uuid, ...fields });
const builder = input => new SurgeConfigBuilder(input, [], [], null, 'zh-CN', null, false);
const build = fields => builder(yaml.dump({ proxies: [node(fields)] })).build();
const policy = (profile, name = 'VLESS') => profile.split('\n').find(line => line.startsWith(`${name} = `));
const uri = query => `vless://${uuid}@node.example.com:443?${new URLSearchParams(query)}#VLESS`;

afterEach(() => vi.restoreAllMocks());

describe('Surge VLESS conversion', () => {
    it('converts the three original source variants into active policies and group members', async () => {
        const proxies = sourceProxies.filter(p => p.type === 'vless');
        const instance = builder(yaml.dump({ proxies }));
        const profile = await instance.build();
        expect(instance.getValidProxies()).toHaveLength(3);
        for (const proxy of proxies) {
            const line = policy(profile, proxy.name);
            expect(line).toContain(' = vless, ');
            expect(line).toContain(`username=${proxy.uuid}`);
            expect(instance.getProxyList()).toContain(proxy.name);
            if (proxy['reality-opts']) {
                expect(line).toContain(`reality-public-key=${publicKey}`);
                expect(line).toContain('reality-short-id=0123456789abcdef');
            }
            if (proxy.network === 'ws') expect(line).toContain('ws=true');
            if (proxy.network === 'grpc') expect(line).toContain('grpc=true, grpc-service-name=grpc');
        }
        expect(profile).not.toContain('Unsupported proxy type: vless');
        expect(profile).toContain('ws-opts.max-early-data');
    });

    it.each(['tcp', 'raw'])('supports plain %s without enabling TLS', async network => {
        const line = policy(await build({ network, encryption: 'none', udp: true, 'packet-encoding': 'xudp' }));
        expect(line).toContain(`username=${uuid}`);
        expect(line).toContain('tls=false');
        expect(line).toContain('encryption=none');
        expect(line).not.toContain('udp-relay=');
    });

    it('preserves TLS validation, pinning, ALPN and Vision', async () => {
        const line = policy(await build({
            tls: 'true', servername: 'cert.example.com', flow: 'xtls-rprx-vision-udp443',
            'skip-cert-verify': 'false', fingerprint, 'name-cert-verify': 'verify.example.com', alpn: ['h2', 'http/1.1']
        }));
        expect(line).toContain('tls=true');
        expect(line).toContain('flow=xtls-rprx-vision-udp443');
        expect(line).toContain('skip-cert-verify=false');
        expect(line).toContain(`server-cert-fingerprint-sha256=${fingerprint}`);
        expect(line).toContain('server-cert-verify-name=verify.example.com');
        expect(line).toContain('alpn="h2,http/1.1"');
    });

    it('lets REALITY imply TLS and keeps X.509-only options out of its handshake', async () => {
        const profile = await build({
            servername: 'cert.example.com', flow: 'xtls-rprx-vision',
            'reality-opts': { 'public-key': publicKey, 'short-id': '' },
            'skip-cert-verify': true, fingerprint
        });
        const line = policy(profile);
        expect(line).toContain(`reality-public-key=${publicKey}`);
        expect(line).toContain('reality-short-id=');
        expect(line).toContain('sni=cert.example.com');
        expect(line).not.toContain('skip-cert-verify');
        expect(line).not.toContain('server-cert-fingerprint');
        expect(profile).toContain('Unmapped Clash fields: skip-cert-verify, fingerprint');
    });

    it('retains WebSocket path and header case', async () => {
        const line = policy(await build({ network: 'ws', tls: true, 'ws-opts': {
            path: '/vless?token=synthetic', headers: { Host: 'cdn.example.com', 'X-Test': 'value' }
        } }));
        expect(line).toContain('ws=true');
        expect(line).toContain('ws-path=/vless?token=synthetic');
        expect(line).toContain('ws-headers=Host:cdn.example.com|X-Test:value');
    });

    it('maps Mihomo HTTPUpgrade and reports unsupported fast-open tuning', async () => {
        const profile = await build({ network: 'ws', 'ws-opts': {
            path: '/up', 'v2ray-http-upgrade': true, 'v2ray-http-upgrade-fast-open': true
        } });
        expect(policy(profile)).toContain('ws=true, ws-http-upgrade=true, ws-path=/up');
        expect(profile).toContain('ws-opts.v2ray-http-upgrade-fast-open');
    });

    it('preserves a custom gRPC path without inferring multi mode', async () => {
        const line = policy(await build({ network: 'grpc', tls: true, servername: 'grpc.example.com',
            'grpc-opts': { 'grpc-service-name': '/custom/TunMulti' }
        }));
        expect(line).toContain('grpc=true, grpc-service-name=/custom/TunMulti');
        expect(line).not.toContain('grpc-mode=multi');
    });

    it('maps XHTTP obfuscation, millisecond intervals, explicit false/zero and XMUX ranges', async () => {
        const profile = await build({ network: 'xhttp', tls: true, 'xhttp-opts': {
            path: '/xhttp', host: 'cdn.example.com', mode: 'packet-up', headers: { 'X-Test': 'synthetic' },
            'no-grpc-header': false, 'x-padding-bytes': '100-1000', 'x-padding-obfs-mode': true,
            'session-placement': 'header', 'session-key': 'X-Session', 'seq-placement': 'query',
            'uplink-http-method': 'POST', 'uplink-data-placement': 'header', 'uplink-data-key': 'X-Data',
            'uplink-chunk-size': '2048', 'sc-max-each-post-bytes': '16384', 'sc-min-posts-interval-ms': 0,
            'reuse-settings': { 'max-concurrency': '8-16', 'max-connections': '3',
                'c-max-reuse-times': '20', 'h-max-request-times': '100-200',
                'h-max-reusable-secs': '300', 'h-keep-alive-period': 0 }
        } });
        const line = policy(profile);
        for (const option of [
            'xhttp=true', 'xhttp-path=/xhttp', 'xhttp-host=cdn.example.com', 'xhttp-mode=packet-up',
            'xhttp-headers=X-Test:synthetic', 'xhttp-no-grpc-header=false', 'xhttp-padding-obfs=true',
            'xhttp-padding-bytes=100-1000', 'xhttp-session-placement=header', 'xhttp-session-key=X-Session',
            'xhttp-seq-placement=query', 'xhttp-uplink-method=POST', 'xhttp-uplink-data-placement=header',
            'xhttp-uplink-data-key=X-Data', 'xhttp-uplink-chunk-size=2048', 'xhttp-max-each-post-bytes=16384',
            'xhttp-min-posts-interval=0', 'xhttp-xmux-max-concurrency=8-16', 'xhttp-xmux-max-reuse-times=20',
            'xhttp-xmux-max-request-times=100-200', 'xhttp-xmux-max-reusable-secs=300', 'xhttp-xmux-keep-alive=0'
        ]) expect(line).toContain(option);
        expect(profile).toContain('xhttp-xmux-max-connections is accepted by Surge but has no effect');
        expect(profile).toContain('xhttp-xmux-keep-alive is accepted by Surge but has no effect');
        expect(profile).not.toContain('Unmapped Clash fields: xhttp-opts');
    });

    it.each(['tcp', 'ws', 'httpupgrade', 'xhttp'])('preserves VLESS Encryption with Vision over %s', async network => {
        const encryption = `mlkem768x25519plus.native.0rtt.${publicKey}`;
        const line = policy(await build({ network, encryption, flow: 'xtls-rprx-vision' }));
        expect(line).toContain(`encryption=${encryption}`);
        expect(line).toContain('flow=xtls-rprx-vision');
    });

    it.each([
        [{ network: 'kcp' }, 'Unsupported VLESS transport'],
        [{ network: 'h2' }, 'Unsupported VLESS transport'],
        [{ flow: 'unknown-flow' }, 'Unsupported VLESS flow'],
        [{ flow: 'xtls-rprx-vision' }, 'VLESS Vision requires'],
        [{ network: 'ws', tls: true, flow: 'xtls-rprx-vision' }, 'VLESS Vision requires'],
        [{ network: 'grpc' }, 'VLESS gRPC requires'],
        [{ network: 'grpc', tls: true, flow: 'xtls-rprx-vision' }, 'VLESS gRPC requires'],
        [{ network: 'ws', 'reality-opts': { 'public-key': publicKey } }, 'VLESS REALITY does not support'],
        [{ network: 'httpupgrade', 'reality-opts': { 'public-key': publicKey } }, 'VLESS REALITY does not support'],
        [{ 'reality-opts': { 'public-key': 'bad-key' } }, 'Invalid VLESS REALITY public key'],
        [{ 'reality-opts': { 'public-key': publicKey, 'short-id': 'not-hex' } }, 'Invalid VLESS REALITY short ID'],
        [{ network: 'xhttp', 'xhttp-opts': { 'download-settings': { server: 'other.example.com' } } }, 'does not support XHTTP download-settings'],
        [{ network: 'xhttp', 'xhttp-opts': { mode: 'unknown' } }, 'Invalid VLESS XHTTP mode'],
        [{ network: 'xhttp', 'xhttp-opts': { 'no-grpc-header': 'invalid' } }, 'Invalid VLESS no-grpc-header flag'],
        [{ network: 'xhttp', 'xhttp-opts': { path: ['/one', '/two'] } }, 'Invalid VLESS XHTTP path'],
        [{ encryption: {} }, 'Invalid VLESS Encryption setting'],
        [{ uuid: '' }, 'VLESS requires a user ID'],
        [{ tls: 'invalid' }, 'Invalid VLESS tls flag'],
        [{ 'packet-encoding': 'packetaddr' }, 'Surge VLESS requires XUDP'],
        [{ network: 'ws', 'ws-opts': { headers: { 'X-Test': 'value|Host:evil.example.com' } } }, 'Invalid VLESS HTTP header']
    ])('rejects unrepresentable or malformed settings %j', async (fields, message) => {
        await expect(build(fields)).rejects.toThrow(message);
    });

    it.each(['direct', 'base64', 'http'])('preserves URI-only gRPC parameters through %s input', async path => {
        const link = uri({ security: 'tls', type: 'grpc', serviceName: '/custom/TunMulti', mode: 'multi', authority: 'grpc.example.com',
            sni: 'cert.example.com', allowInsecure: '0', alpn: 'h2', encryption: 'none', pcs: fingerprint, vcn: 'verify.example.com' });
        let input = link;
        if (path === 'base64') input = btoa(link);
        if (path === 'http') {
            input = 'https://subscription.example.com/vless';
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(link));
        }
        const line = policy(await builder(input).build());
        expect(line).toContain('grpc-mode=multi');
        expect(line).toContain('grpc-authority=grpc.example.com');
        expect(line).toContain('grpc-service-name=/custom/TunMulti');
        expect(line).toContain('skip-cert-verify=false');
        expect(line).toContain(`server-cert-fingerprint-sha256=${fingerprint}`);
        expect(line).toContain('server-cert-verify-name=verify.example.com');
    });

    it('preserves XHTTP share-link extra fields and the splithttp alias', async () => {
        const link = uri({ type: 'splithttp', security: 'reality', pbk: publicKey, sid: 'abcd', sni: 'cert.example.com',
            path: '/xhttp', extra: JSON.stringify({ noGRPCHeader: false, xPaddingObfsMode: true, scMinPostsIntervalMs: 7,
                sessionIDPlacement: 'cookie', xmux: { cMaxReuseTimes: '5-10' } }) });
        const line = policy(await builder(link).build());
        expect(line).toContain(`reality-public-key=${publicKey}`);
        expect(line).toContain('xhttp=true, xhttp-path=/xhttp');
        expect(line).toContain('xhttp-no-grpc-header=false');
        expect(line).toContain('xhttp-padding-obfs=true');
        expect(line).toContain('xhttp-min-posts-interval=7');
        expect(line).toContain('xhttp-session-placement=cookie');
        expect(line).toContain('xhttp-xmux-max-reuse-times=5-10');
    });

    it('rejects independent XHTTP download settings in share links', async () => {
        const link = uri({ type: 'xhttp', extra: JSON.stringify({ downloadSettings: { address: 'other.example.com' } }) });
        await expect(builder(link).build()).rejects.toThrow('does not support XHTTP download-settings');
    });

    it('preserves HTTPUpgrade and Encryption on share links', async () => {
        const encryption = `mlkem768x25519plus.native.0rtt.${publicKey}`;
        const link = uri({ type: 'httpupgrade', encryption, flow: 'xtls-rprx-vision', path: '/up', host: 'cdn.example.com' });
        const line = policy(await builder(link).build());
        expect(line).toContain(`encryption=${encryption}`);
        expect(line).toContain('ws=true, ws-http-upgrade=true, ws-path=/up, ws-headers=Host:cdn.example.com');
    });

    it.each([
        [{ type: 'xhttp', extra: 'invalid JSON' }, 'Invalid VLESS XHTTP extra settings'],
        [{ type: 'grpc', security: 'tls', mode: 'unknown' }, 'Invalid VLESS gRPC mode'],
        [{ security: 'unknown' }, 'Unsupported VLESS security']
    ])('rejects malformed share-link options %j', async (params, message) => {
        await expect(builder(uri(params)).build()).rejects.toThrow(message);
    });

    it('handles IPv6 endpoints and fragments on links without query parameters', async () => {
        const result = await builder(`vless://${uuid}@[2001:db8::1]:8443#IPv6`).build();
        expect(policy(result, 'IPv6')).toContain('vless, 2001:db8::1, 8443');
    });

    it('supports normalized sing-box VLESS input', async () => {
        const result = await builder(JSON.stringify({ outbounds: [{ type: 'vless', tag: 'VLESS', server: 'node.example.com',
            server_port: 443, uuid, tls: { enabled: true, server_name: 'cert.example.com' },
            transport: { type: 'httpupgrade', path: '/up', headers: { Host: 'cdn.example.com' } } }] })).build();
        expect(policy(result)).toContain('ws=true, ws-http-upgrade=true, ws-path=/up');
        expect(policy(result)).toContain('tls=true');
    });

    it('keeps the shared URI parser free of Surge-specific fields', async () => {
        const parsed = await ProxyParser.parse(uri({ type: 'grpc', security: 'tls', serviceName: 'grpc', authority: 'grpc.example.com' }));
        expect(parsed.transport).toEqual({ type: 'grpc', path: undefined, service_name: 'grpc' });
        expect(parsed).not.toHaveProperty('surgeSource');
        expect(parsed).not.toHaveProperty('surgeVlessUri');
    });
});
