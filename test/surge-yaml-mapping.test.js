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
    it.each(['hysteria2', 'tuic'])('preserves certificate pinning for %s without disabling validation', async (type) => {
        const source = getSource(type);
        const line = policy(await build([source]), source.name);
        expect(line).toContain(`server-cert-fingerprint-sha256=${fingerprint}`);
        expect(line).toContain('sni=cert.example.com');
        expect(line).toContain('skip-cert-verify=false');
        expect(line).not.toContain('skip-cert-verify=true');
    });

    it('preserves a textual false verification flag and quotes multiple ALPN values', async () => {
        const source = getSource('hysteria2');
        source['skip-cert-verify'] = 'false';
        source.alpn = ['h3', 'synthetic-protocol'];
        const line = policy(await build([source]), source.name);
        expect(line).toContain('skip-cert-verify=false');
        expect(line).toContain('alpn="h3,synthetic-protocol"');
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
