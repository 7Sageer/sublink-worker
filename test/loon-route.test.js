import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

function createTestApp(kv = new MemoryKVAdapter()) {
    return createApp({
        kv,
        assetFetcher: null,
        logger: console,
        config: {
            configTtlSeconds: 60,
            shortLinkTtlSeconds: null
        }
    });
}

describe('Loon routes', () => {
    it('returns a Loon configuration', async () => {
        const app = createTestApp();
        const input = 'trojan://secret@trojan.example.com:443?security=tls&sni=trojan.example.com#Loon-Trojan';
        const response = await app.request(`http://localhost/loon?config=${encodeURIComponent(input)}`);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/plain');
        expect(await response.text()).toContain('Loon-Trojan = trojan, trojan.example.com, 443, "secret"');
    });

    it('rejects input without a Loon-compatible proxy', async () => {
        const app = createTestApp();
        const input = 'tuic://uuid:password@tuic.example.com:443#TUIC';
        const response = await app.request(`http://localhost/loon?config=${encodeURIComponent(input)}`);

        expect(response.status).toBe(400);
        expect(await response.text()).toContain('No Loon-compatible proxies found');
    });

    it('supports Loon short links and resolving them', async () => {
        const kv = new MemoryKVAdapter();
        await kv.put('loon-code', '?config=test');
        const app = createTestApp(kv);

        const redirect = await app.request('http://localhost/l/loon-code', { redirect: 'manual' });
        expect(redirect.status).toBe(302);
        expect(redirect.headers.get('location')).toBe('http://localhost/loon?config=test');

        const resolved = await app.request('http://localhost/resolve?url=http%3A%2F%2Flocalhost%2Fl%2Floon-code');
        expect(resolved.status).toBe(200);
        expect(await resolved.json()).toEqual({ originalUrl: 'http://localhost/loon?config=test' });
    });

    it('renders the Loon target in the subscription links UI', async () => {
        const response = await createTestApp().request('http://localhost/');
        const html = await response.text();

        expect(html).toContain('Loon 链接');
        expect(html).toContain("loon: origin + '/loon?'");
        expect(html).toContain("loon: 'l'");
    });
});
