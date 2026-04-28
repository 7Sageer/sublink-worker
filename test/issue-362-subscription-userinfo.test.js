import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { decodeBase64 } from '../src/utils.js';

const subscriptionUserinfo = 'upload=123; download=456; total=1024; expire=1893456000';
const remoteSubscriptionUrl = 'https://airport.example.com/sub?token=abc';
const proxyUri = 'ss://YWVzLTEyOC1nY206cGFzcw@example.com:443#Issue362';

function createTestApp() {
    return createApp({
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: console,
        config: {
            configTtlSeconds: 60,
            shortLinkTtlSeconds: null
        }
    });
}

function mockRemoteSubscription() {
    vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => proxyUri,
        headers: {
            get: (name) => name.toLowerCase() === 'subscription-userinfo'
                ? subscriptionUserinfo
                : null
        }
    })));
}

describe('Issue #362 - subscription userinfo passthrough', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('preserves subscription-userinfo when converting remote subscriptions to Clash', async () => {
        mockRemoteSubscription();
        const app = createTestApp();

        const res = await app.request(`http://localhost/clash?config=${encodeURIComponent(remoteSubscriptionUrl)}`);

        expect(res.status).toBe(200);
        expect(res.headers.get('subscription-userinfo')).toBe(subscriptionUserinfo);
        expect(await res.text()).toContain('Issue362');
    });

    it('preserves subscription-userinfo when converting remote subscriptions to Sing-Box', async () => {
        mockRemoteSubscription();
        const app = createTestApp();

        const res = await app.request(`http://localhost/singbox?config=${encodeURIComponent(remoteSubscriptionUrl)}`);

        expect(res.status).toBe(200);
        expect(res.headers.get('subscription-userinfo')).toBe(subscriptionUserinfo);
        const json = await res.json();
        expect(json.outbounds.some(outbound => outbound.tag === 'Issue362')).toBe(true);
    });

    it('preserves subscription-userinfo when converting remote subscriptions to Xray', async () => {
        mockRemoteSubscription();
        const app = createTestApp();

        const res = await app.request(`http://localhost/xray?config=${encodeURIComponent(remoteSubscriptionUrl)}`);

        expect(res.status).toBe(200);
        expect(res.headers.get('subscription-userinfo')).toBe(subscriptionUserinfo);
        expect(decodeBase64(await res.text())).toBe(proxyUri);
    });
});
