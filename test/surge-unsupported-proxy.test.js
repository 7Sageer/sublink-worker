import { describe, it, expect } from 'vitest';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';

/**
 * Test for GitHub Issue #299
 * https://github.com/7Sageer/sublink-worker/issues/299
 *
 * Unsupported-policy comments must stay out of proxy groups (Issue #299).
 * VLESS is now supported, so a synthetic protocol keeps this regression relevant.
 */
describe('Surge unsupported proxy type handling (Issue #299)', () => {
    const unsupported = { type: 'unsupported-test-protocol', tag: 'USA-Unsupported', server: 'node.example.com', server_port: 443 };
    const mixedProtocolInput = JSON.stringify({ outbounds: [
        { type: 'hysteria2', tag: 'USA-HY2', server: 'one.example.com', server_port: 8443, password: 'synthetic' },
        unsupported,
        { type: 'hysteria2', tag: 'USA-HY22', server: 'two.example.com', server_port: 8443, password: 'synthetic' }
    ] });

    it('should not include comment strings in proxy groups', async () => {
        const builder = new SurgeConfigBuilder(
            mixedProtocolInput,
            'minimal',
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();

        // Extract [Proxy Group] section
        const proxyGroupMatch = result.match(/\[Proxy Group\]([\s\S]*?)(?=\n\[|$)/);
        expect(proxyGroupMatch).not.toBeNull();

        const proxyGroupSection = proxyGroupMatch[1];

        // The comment string should NOT appear in proxy groups
        expect(proxyGroupSection).not.toContain('USA-Unsupported');
        expect(proxyGroupSection).not.toContain('Unsupported proxy type');
    });

    it('should only include supported proxies in proxy groups', async () => {
        const builder = new SurgeConfigBuilder(
            mixedProtocolInput,
            'minimal',
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();

        // Extract [Proxy Group] section
        const proxyGroupMatch = result.match(/\[Proxy Group\]([\s\S]*?)(?=\n\[|$)/);
        const proxyGroupSection = proxyGroupMatch[1];

        // Should contain supported proxies
        expect(proxyGroupSection).toContain('USA-HY2');
        expect(proxyGroupSection).toContain('USA-HY22');

        expect(proxyGroupSection).not.toContain('USA-Unsupported');
        expect(proxyGroupSection).not.toMatch(/,\s*#[^,\n]*/);
    });

    it('should allow comment in [Proxy] section for informational purposes', async () => {
        const builder = new SurgeConfigBuilder(
            mixedProtocolInput,
            'minimal',
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();

        // Extract [Proxy] section
        const proxyMatch = result.match(/\[Proxy\]([\s\S]*?)(?=\n\[Proxy Group\])/);
        expect(proxyMatch).not.toBeNull();

        const proxySection = proxyMatch[1];

        expect(proxySection).toContain('# USA-Unsupported - Unsupported proxy type: unsupported-test-protocol');

        // Should contain supported proxies
        expect(proxySection).toContain('USA-HY2');
        expect(proxySection).toContain('USA-HY22');
    });

    it('should generate valid Surge config syntax', async () => {
        const builder = new SurgeConfigBuilder(
            mixedProtocolInput,
            'minimal',
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();

        // Extract a proxy group line and verify syntax
        const autoSelectMatch = result.match(/⚡ 自动选择 = url-test,([^\n]+)/);
        expect(autoSelectMatch).not.toBeNull();

        const proxyList = autoSelectMatch[1];

        // Each item in the proxy list should be a valid proxy name (no # comments)
        const items = proxyList.split(',').map(s => s.trim()).filter(s => s && !s.startsWith('url=') && !s.startsWith('interval='));

        for (const item of items) {
            // No item should start with #
            expect(item.startsWith('#')).toBe(false);
            // No item should contain "Unsupported"
            expect(item).not.toContain('Unsupported');
        }
    });

    it('should handle input with only unsupported protocols gracefully', async () => {
        const unsupportedOnlyInput = JSON.stringify({ outbounds: [unsupported] });

        const builder = new SurgeConfigBuilder(
            unsupportedOnlyInput,
            'minimal',
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();

        // Should still generate valid config structure
        expect(result).toContain('[General]');
        expect(result).toContain('[Proxy]');
        expect(result).toContain('[Proxy Group]');
        expect(result).toContain('[Rule]');

        // Proxy groups should not contain comment strings
        const proxyGroupMatch = result.match(/\[Proxy Group\]([\s\S]*?)(?=\n\[|$)/);
        if (proxyGroupMatch) {
            expect(proxyGroupMatch[1]).not.toContain('USA-Unsupported');
        }
    });
});
