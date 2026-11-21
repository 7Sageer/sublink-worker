import { afterEach, describe, expect, it, vi } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { encodeBase64 } from '../src/utils.js';

const GOOD = `ss://${btoa('aes-128-gcm:pw')}@1.2.3.4:8388#GOOD`;
const BAD = [
    'vmess://not-base64!!',
    `vmess://${btoa('{"add":"1.2.3.4","port":"443"')}`,
    'vless://%E0%A4%A@1.2.3.4:443#BAD',
];

async function proxyTags(input) {
    const builder = new SingboxConfigBuilder(input, [], [], null, 'en-US', 'test', false, false, undefined, undefined, '1.14');
    const config = await builder.build();
    return config.outbounds.filter(o => o.server).map(o => o.tag);
}

// One link the parser cannot read used to fail the whole request with a 500,
// or silently drop every node after it inside a subscription.
describe('malformed share links', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each(BAD)('skips %s and keeps the other nodes', async (bad) => {
        expect(await proxyTags(`${bad}\n${GOOD}`)).toEqual(['GOOD']);
    });

    it('keeps nodes after a malformed link inside a subscription', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({
            ok: true,
            status: 200,
            text: async () => encodeBase64(`${BAD[0]}\n${GOOD}`),
            headers: { get: () => null }
        })));
        expect(await proxyTags('https://sub.example.com/link')).toEqual(['GOOD']);
    });

    it('returns 200 over HTTP', async () => {
        const app = createApp({ kv: new MemoryKVAdapter(), assetFetcher: null, logger: console, config: { configTtlSeconds: 60, shortLinkTtlSeconds: null } });
        const res = await app.request(`http://localhost/clash?config=${encodeURIComponent(`${BAD[0]}\n${GOOD}`)}`);
        expect(res.status).toBe(200);
        expect(await res.text()).toContain('GOOD');
    });
});
