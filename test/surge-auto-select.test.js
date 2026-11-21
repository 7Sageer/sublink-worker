import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';

const proxyUri = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#Diagnostic';

describe('Surge auto-select option', () => {
    it.each([
        { description: 'with a proxy', input: proxyUri, includeAutoSelect: false },
        { description: 'without parsed proxies', input: 'not-a-valid-subscription', includeAutoSelect: false },
        { description: 'with a proxy', input: proxyUri, includeAutoSelect: true },
        { description: 'without parsed proxies', input: 'not-a-valid-subscription', includeAutoSelect: true }
    ])('generates a profile $description when include_auto_select=$includeAutoSelect', async ({ input, includeAutoSelect }) => {
        const app = createApp({ kv: new MemoryKVAdapter() });
        const query = new URLSearchParams({
            config: input,
            selectedRules: '[]',
            customRules: '[]',
            include_auto_select: String(includeAutoSelect)
        });

        const response = await app.request(`http://localhost/surge?${query}`);

        expect(response.status).toBe(200);
        const profile = await response.text();
        expect(profile).toContain('[Proxy]');
        expect(profile).toContain('🚀 节点选择 = select,');
        expect(profile.includes('⚡ 自动选择 = url-test,')).toBe(includeAutoSelect);
        if (input === proxyUri) {
            expect(profile).toContain('Diagnostic = ss, example.com, 443');
        }
    });

    it('preserves existing groups when auto-select is disabled', async () => {
        const builder = new SurgeConfigBuilder(
            proxyUri,
            [],
            [],
            { 'proxy-groups': ['Existing = select, DIRECT'] },
            'zh-CN',
            null,
            false,
            false
        );

        const profile = await builder.build();

        expect(profile).toContain('Existing = select, DIRECT');
        expect(profile).toContain('🚀 节点选择 = select,');
        expect(profile).not.toContain('⚡ 自动选择');
    });
});
