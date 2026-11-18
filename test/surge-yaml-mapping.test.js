import { afterEach, describe, expect, it, vi } from 'vitest';
import yaml from 'js-yaml';
import sourceProxies from './fixtures/surge-source-proxies.json';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import { parseClashYaml } from '../src/parsers/subscription/subscriptionContentParser.js';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const fingerprint = '11'.repeat(32);
const getSource = (type) => structuredClone(sourceProxies.find(p => p.type === type));
const makeBuilder = (input) => new SurgeConfigBuilder(input, [], [], null, 'zh-CN', null, false);
const build = (proxies) => makeBuilder(yaml.dump({ proxies })).build();
const policy = (profile, name) => profile.split('\n').find(line => line.startsWith(`${name} = `));

afterEach(() => vi.restoreAllMocks());

describe('Clash YAML to Surge parameter mapping', () => {
    it.each(['hysteria2', 'tuic', 'trojan', 'anytls'])('preserves certificate pinning for %s without disabling validation', async (type) => {
        const source = getSource(type);
        const line = policy(await build([source]), source.name);
        expect(line).toContain(`server-cert-fingerprint-sha256=${fingerprint}`);
        expect(line).toContain('sni=cert.example.com');
        expect(line).toContain('skip-cert-verify=false');
        expect(line).not.toContain('skip-cert-verify=true');
    });

    it('preserves hopping and converts download bandwidth units', async () => {
        const source = getSource('hysteria2');
        source.ports = '50000-51000, 52000';
        const line = policy(await build([source]), source.name);
        expect(line).toContain('port-hopping="50000-51000;52000"');
        expect(line).toContain('port-hopping-interval=30');
        expect(line).toContain('download-bandwidth=1000');
    });

    it.each([[100, 100], ['0.5 Gbps', 500], ['1000 Kbps', 1]])('converts download bandwidth %s to %s Mbps', async (down, expected) => {
        const source = getSource('hysteria2');
        source.down = down;
        expect(policy(await build([source]), source.name)).toContain(`download-bandwidth=${expected}`);
    });

    it.each(['0', '65536', '51000-50000', '443,,8443'])('rejects invalid hopping range %s', async (ports) => {
        const source = getSource('hysteria2');
        source.ports = ports;
        await expect(build([source])).rejects.toThrow('Invalid Hysteria2 port hopping range');
    });

    it.each(['fast', '-1 Mbps'])('rejects invalid bandwidth %s', async (down) => {
        const source = getSource('hysteria2');
        source.down = down;
        await expect(build([source])).rejects.toThrow('Invalid Hysteria2 download bandwidth');
    });

    it('preserves a textual false verification flag and quotes multiple ALPN values', async () => {
        const source = getSource('hysteria2');
        source['skip-cert-verify'] = 'false';
        source.alpn = ['h3', 'synthetic-protocol'];
        const line = policy(await build([source]), source.name);
        expect(line).toContain('skip-cert-verify=false');
        expect(line).toContain('alpn="h3,synthetic-protocol"');
    });

    it('preserves VMess cipher and case-sensitive WebSocket headers', async () => {
        const source = getSource('vmess');
        source['ws-opts'].headers['X-Test'] = 'synthetic';
        const line = policy(await build([source]), source.name);
        expect(line).toContain('encrypt-method=aes-128-gcm');
        expect(line).toContain('vmess-aead=true');
        expect(line).toContain('ws-path=/synthetic-path');
        expect(line).toContain('ws-headers=Host:node.example.com|X-Test:synthetic');
        expect(line).not.toContain('undefined');
    });

    it('preserves ShadowTLS instead of producing an ordinary Shadowsocks policy', async () => {
        const source = sourceProxies.find(p => p.plugin === 'shadow-tls');
        const line = policy(await build([source]), source.name);
        expect(line).toContain('shadow-tls-password=synthetic-password');
        expect(line).toContain('shadow-tls-sni=shadow.example.com');
        expect(line).toContain('shadow-tls-version=3');
    });

    it.each([true, false])('preserves Shadowsocks UDP relay setting %s', async (udp) => {
        const source = getSource('ss');
        source.udp = udp;
        expect(policy(await build([source]), source.name)).toContain(`udp-relay=${udp}`);
    });

    it('identifies undocumented TUIC options while preserving authentication and certificate pinning', async () => {
        const source = getSource('tuic');
        const profile = await build([source]);
        const line = policy(profile, source.name);
        expect(profile).toContain('Legacy TUIC congestion-controller/udp-relay-mode options are not documented by Surge');
        expect(line).toContain(`uuid=${source.uuid}`);
        expect(line).toContain(`server-cert-fingerprint-sha256=${fingerprint}`);
        expect(line).toContain('skip-cert-verify=false');
    });

    it('keeps Snell v6 authentication and transport options', async () => {
        const source = getSource('snell');
        const line = policy(await build([source]), source.name);
        expect(line).toContain('= snell, node.example.com, 8893, psk=synthetic-password');
        expect(line).toContain('version=6');
        expect(line).toContain('mode=default');
        expect(line).toContain('reuse=true');
    });

    it.each([[true, false], [false, true], ['false', true]])('maps AnyTLS disable-reuse=%s to reuse=%s', async (disabled, reuse) => {
        const source = getSource('anytls');
        source['disable-reuse'] = disabled;
        const profile = await build([source]);
        expect(policy(profile, source.name)).toContain(`reuse=${reuse}`);
        expect(profile).not.toContain('disable-reuse');
    });

    it('rejects an invalid AnyTLS reuse flag', async () => {
        const source = getSource('anytls');
        source['disable-reuse'] = 'invalid';
        await expect(build([source])).rejects.toThrow('Invalid AnyTLS disable-reuse flag');
    });

    it.each([true, false])('silently ignores top-level Brutal settings with enabled=%s', async (enabled) => {
        const source = getSource('trojan');
        delete source.smux;
        source['brutal-opts'] = { enabled, up: 'synthetic-up', down: 'synthetic-down' };
        const profile = await build([source]);
        expect(policy(profile, source.name)).toContain(' = trojan, ');
        expect(profile).not.toContain('brutal-opts');
        expect(profile).not.toContain('TCP Brutal');
    });

    it.each([
        [false, true], [true, false], [true, undefined], [undefined, true],
        ['false', 'true'], ['true', 'false']
    ])('silently ignores inactive Brutal settings with smux=%s and brutal=%s', async (smuxEnabled, brutalEnabled) => {
        const source = getSource('trojan');
        delete source['brutal-opts'];
        source.smux = {
            ...(smuxEnabled !== undefined ? { enabled: smuxEnabled } : {}),
            protocol: 'h2mux',
            'brutal-opts': { ...(brutalEnabled !== undefined ? { enabled: brutalEnabled } : {}), up: 50, down: 100 }
        };
        const profile = await build([source]);
        expect(profile).not.toContain('brutal-opts');
        expect(profile).not.toContain('TCP Brutal');
        expect(profile).toContain('smux.protocol');
    });

    it.each([true, 'true', '1'])('reports active Brutal once while keeping SMUX diagnostics for enabled=%s', async (enabled) => {
        const source = getSource('trojan');
        source.smux = { enabled, protocol: 'h2mux', 'brutal-opts': { enabled, up: 'synthetic-up', down: 'synthetic-down' } };
        const profile = await build([source]);
        expect(profile.match(/TCP Brutal is enabled in Clash but unsupported by Surge/g)).toHaveLength(1);
        expect(profile).not.toContain('brutal-opts');
        expect(profile).toContain('smux.enabled');
        expect(profile).toContain('smux.protocol');
        expect(profile).not.toContain('synthetic-up');
        expect(profile).not.toContain('synthetic-down');
    });

    it.each([['invalid', true], [true, 'invalid']])('keeps diagnostics for unknown flags smux=%s and brutal=%s', async (smuxEnabled, brutalEnabled) => {
        const source = getSource('trojan');
        source.smux = { enabled: smuxEnabled, 'brutal-opts': { enabled: brutalEnabled } };
        const profile = await build([source]);
        expect(profile).toContain('smux.brutal-opts.enabled');
        expect(profile).not.toContain('TCP Brutal');
    });

    it('accounts for all eleven source nodes and identifies unmapped fields without leaking their values', async () => {
        const builder = makeBuilder(yaml.dump({ proxies: sourceProxies }));
        const profile = await builder.build();
        expect(builder.getValidProxies()).toHaveLength(11);
        for (const source of sourceProxies) {
            expect(policy(profile, source.name)).toBeDefined();
            expect(builder.getProxyList()).toContain(source.name);
        }
        expect(profile).toContain('Unmapped Clash fields: up');
        expect(profile).toContain('request-timeout');
        expect(profile).toContain('client-fingerprint');
        expect(profile).toContain('smux.enabled');
        expect(profile).toContain('idle-session-check-interval');
        expect(profile).not.toContain('brutal-opts');
        const comments = profile.split('\n').filter(line => line.startsWith('#')).join('\n');
        expect(comments).not.toContain('synthetic-password');
        expect(comments).not.toContain('1000 Mbps');
    });

    it.each(['direct', 'base64', 'http'])('keeps pinning through the %s subscription path', async (path) => {
        const content = yaml.dump({ proxies: [getSource('hysteria2')] });
        let input = content;
        if (path === 'base64') input = btoa(content);
        if (path === 'http') {
            input = 'https://subscription.example.com/list';
            vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(content));
        }
        expect(await makeBuilder(input).build()).toContain(`server-cert-fingerprint-sha256=${fingerprint}`);
    });

    it.each(['invalid', '11'.repeat(31), '11'.repeat(33), '11'.repeat(32) + '\n'])('rejects malformed certificate pins', async (pin) => {
        const source = getSource('hysteria2');
        source.fingerprint = pin;
        await expect(build([source])).rejects.toThrow('Invalid SHA-256 certificate fingerprint');
    });

    it('returns a clean HTTP 400 for an invalid pin from a remote subscription', async () => {
        const source = getSource('hysteria2');
        source.fingerprint = 'not-a-certificate-pin';
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(yaml.dump({ proxies: [source] })));
        const app = createApp({ kv: new MemoryKVAdapter(), logger: { error: vi.fn() } });
        const response = await app.request('/surge?config=' + encodeURIComponent('https://subscription.example.com/list'));
        expect(response.status).toBe(400);
        expect(await response.text()).not.toContain(source.password);
    });

    it('keeps the default YAML parser unchanged for other builders', () => {
        const result = parseClashYaml(yaml.dump({ proxies: sourceProxies }));
        expect(result.proxies).toHaveLength(10);
        expect(result.proxies.every(p => !Object.hasOwn(p, 'surgeSource'))).toBe(true);
    });
});
