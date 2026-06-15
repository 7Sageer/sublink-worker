import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { addCountryFlagToNodeName } from '../src/utils.js';

const createTestApp = () => createApp({
    kv: new MemoryKVAdapter(),
    assetFetcher: null,
    logger: console,
    config: {
        configTtlSeconds: 60,
        shortLinkTtlSeconds: null
    }
});

const sampleInput = [
    'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#US-Node-1',
    'ss://YWVzLTEyOC1nY206dGVzdA@example.com:444#香港节点2',
    'ss://YWVzLTEyOC1nY206dGVzdA@example.com:445#🇯🇵 JP-Node-1'
].join('\n');

describe('country flags in node names', () => {
    it('adds a detected country flag and avoids duplicates', () => {
        expect(addCountryFlagToNodeName('US-Node-1')).toBe('🇺🇸 US-Node-1');
        expect(addCountryFlagToNodeName('香港节点2')).toBe('🇭🇰 香港节点2');
        expect(addCountryFlagToNodeName('台湾节点')).toBe('🇹🇼 台湾节点');
        expect(addCountryFlagToNodeName('芬兰节点')).toBe('🇫🇮 芬兰节点');
        expect(addCountryFlagToNodeName('HU-Node-1')).toBe('🇭🇺 HU-Node-1');
        expect(addCountryFlagToNodeName('🇯🇵 JP-Node-1')).toBe('🇯🇵 JP-Node-1');
        expect(addCountryFlagToNodeName('plain-node')).toBe('plain-node');
    });

    it('keeps Clash node names unchanged by default', async () => {
        const app = createTestApp();
        const res = await app.request(`http://localhost/clash?config=${encodeURIComponent(sampleInput)}`);
        expect(res.status).toBe(200);

        const built = yaml.load(await res.text());
        const names = (built.proxies || []).map(proxy => proxy.name);
        expect(names).toContain('US-Node-1');
        expect(names).toContain('香港节点2');
        expect(names).not.toContain('🇺🇸 US-Node-1');
    });

    it('adds flags to Clash node names when show_flags=true', async () => {
        const app = createTestApp();
        const res = await app.request(`http://localhost/clash?show_flags=true&config=${encodeURIComponent(sampleInput)}`);
        expect(res.status).toBe(200);

        const built = yaml.load(await res.text());
        const names = (built.proxies || []).map(proxy => proxy.name);
        expect(names).toEqual(expect.arrayContaining([
            '🇺🇸 US-Node-1',
            '🇭🇰 香港节点2',
            '🇯🇵 JP-Node-1'
        ]));
        expect(names).not.toContain('🇯🇵 🇯🇵 JP-Node-1');
    });

    it('adds flags to SingBox outbound tags when show_flags=true', async () => {
        const app = createTestApp();
        const res = await app.request(`http://localhost/singbox?show_flags=true&config=${encodeURIComponent(sampleInput)}`);
        expect(res.status).toBe(200);

        const built = await res.json();
        const tags = (built.outbounds || []).map(outbound => outbound.tag);
        expect(tags).toEqual(expect.arrayContaining([
            '🇺🇸 US-Node-1',
            '🇭🇰 香港节点2',
            '🇯🇵 JP-Node-1'
        ]));
    });

    it('adds flags to Surge proxy names when show_flags=true', async () => {
        const app = createTestApp();
        const res = await app.request(`http://localhost/surge?show_flags=true&config=${encodeURIComponent(sampleInput)}`);
        expect(res.status).toBe(200);

        const text = await res.text();
        expect(text).toContain('🇺🇸 US-Node-1 = ss');
        expect(text).toContain('🇭🇰 香港节点2 = ss');
        expect(text).toContain('🇯🇵 JP-Node-1 = ss');
    });
});
