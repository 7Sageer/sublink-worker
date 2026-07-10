import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const input = 'ss://YWVzLTEyOC1nY206c2VjcmV0@ss.example.com:443#Rule-URL-Test';
const selectedRules = JSON.stringify(['Google']);

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

async function getConfig(target, useGhProxy) {
    const query = new URLSearchParams({
        config: input,
        selectedRules
    });
    if (useGhProxy === false) query.set('use_gh_proxy', 'false');
    const response = await createTestApp().request(`http://localhost/${target}?${query}`);
    expect(response.status).toBe(200);
    return response.text();
}

describe('rule set URL proxy option', () => {
    it.each(['singbox', 'clash', 'surge', 'loon'])('uses gh-proxy by default for %s', async (target) => {
        const config = await getConfig(target, true);
        expect(config).toContain('https://gh-proxy.com/https://github.com/');
    });

    it.each(['singbox', 'clash', 'surge', 'loon'])('uses direct GitHub URLs for %s when disabled', async (target) => {
        const config = await getConfig(target, false);
        expect(config).toContain('https://github.com/');
        expect(config).not.toContain('https://gh-proxy.com/');
    });

    it('renders the option and adds the query parameter only when disabled', async () => {
        const html = await (await createTestApp().request('http://localhost/')).text();

        expect(html).toContain('通过 gh-proxy 下载规则集');
        expect(html).toContain("if (!this.useGhProxy) params.append('use_gh_proxy', 'false')");
    });
});
