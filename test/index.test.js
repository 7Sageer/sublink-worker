import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const runtime = {
    kv: new MemoryKVAdapter(),
    assetFetcher: null,
    logger: console,
    config: {
        configTtlSeconds: 60,
        shortLinkTtlSeconds: null
    }
};

const app = createApp(runtime);

describe('Worker', () => {
    it('responds with HTML on root path', async () => {
        const res = await app.request('http://example.com/');
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
        const text = await res.text();
        expect(text).toContain('<!DOCTYPE html>');
    });

    it('responds with 404 for unknown paths', async () => {
        const res = await app.request('http://example.com/unknown-path');
        expect(res.status).toBe(404);
    });
});
