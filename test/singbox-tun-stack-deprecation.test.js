import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

// sing-box 1.15 replaced the TUN stack implementations with its own TCP/IP
// stack, deprecating the `stack` option (removed in 1.17).
const VMESS_LINK = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogInRlc3QiLA0KICAiYWRkIjogIjEuMS4xLjEiLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYWRkNjY2NjYtODg4OC04ODg4LTg4ODgtODg4ODg4ODg4ODg4IiwNCiAgImFpZCI6ICIwIiwNCiAgInNjeSI6ICJhdXRvIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvIiwNCiAgInRscyI6ICJ0bHMiDQp9';

const createTestApp = () => createApp({
    kv: new MemoryKVAdapter(),
    assetFetcher: null,
    logger: console,
    config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
});

const buildConfig = async (singboxVersion, baseConfig = null) => {
    const builder = new SingboxConfigBuilder(VMESS_LINK, [], [], baseConfig, 'zh-CN', 'test', false, false, undefined, undefined, singboxVersion);
    return builder.build();
};

const tunInbound = (config) => config.inbounds.find(inbound => inbound.type === 'tun');

describe('sing-box 1.15 TUN stack deprecation', () => {
    it.each(['1.11', '1.12', '1.14'])('keeps stack on the %s tier', async (tier) => {
        const config = await buildConfig(tier);
        expect(tunInbound(config).stack).toBe('mixed');
    });

    it('drops stack on the 1.15 tier', async () => {
        const tun = tunInbound(await buildConfig('1.15'));
        expect(tun).toBeDefined();
        expect(tun).not.toHaveProperty('stack');
    });

    it('drops stack from a stored base config on the 1.15 tier', async () => {
        const storedConfig = {
            inbounds: [{ type: 'tun', tag: 'tun-in', address: '172.19.0.1/30', auto_route: true, strict_route: true, stack: 'gvisor' }],
            outbounds: [{ type: 'direct', tag: 'DIRECT' }],
            route: { rule_set: [], rules: [] }
        };
        const config = await buildConfig('1.15', storedConfig);
        expect(tunInbound(config)).not.toHaveProperty('stack');
    });

    it('keeps the 1.14 rule-set http client on the 1.15 tier', async () => {
        const config = await buildConfig('1.15');
        expect(config.route.default_http_client).toBeDefined();
        expect(config.http_clients?.[0]?.tag).toBe(config.route.default_http_client);
    });

    it.each([
        ['SFI/1.12.2 (Build 2; sing-box 1.15.0; language zh_CN)', false],
        ['sing-box 1.14.4', true]
    ])('resolves stack handling for UA %s', async (userAgent, expectStack) => {
        const app = createTestApp();
        const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(VMESS_LINK)}`, {
            headers: { 'User-Agent': userAgent }
        });
        expect(res.status).toBe(200);
        const tun = tunInbound(await res.json());
        expect('stack' in tun).toBe(expectStack);
    });

    it('drops stack for the explicit latest alias', async () => {
        const app = createTestApp();
        const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(VMESS_LINK)}&sb_ver=latest`);
        const config = await res.json();
        expect(tunInbound(config)).not.toHaveProperty('stack');
    });
});
