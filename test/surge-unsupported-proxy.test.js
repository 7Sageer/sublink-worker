import { describe, it, expect } from 'vitest';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';

/**
 * Test for GitHub Issue #299
 * https://github.com/7Sageer/sublink-worker/issues/299
 *
 * Problem: When subscription contains unsupported proxy types (like VLESS),
 * the comment string "# USA-VLESS - Unsupported proxy type: vless" is incorrectly
 * added to Proxy Groups, breaking the config syntax.
 */
describe('Surge unsupported proxy type handling (Issue #299)', () => {
    // Test input from issue #299 - contains VLESS which Surge doesn't support
    const mixedProtocolInput = `hysteria2://580ef251-af2b-49f4-aea4-56a8a8f7a391@demo.de:8443?peer=demo.de&insecure=0&sni=demo.de&alpn=h3#USA-HY2
vless://580ef251-af2b-49f4-aea4-56a8a8f7a391@1.2.3.4:8443?encryption=none&security=reality&type=tcp&sni=m.media-amazon.com&fp=chrome&pbk=testpublickey&sid=testsid&flow=xtls-rprx-vision#USA-VLESS
hysteria2://11111251-af2b-49f4-aea4-56a8a8f7a391@demo1.de:8443?peer=demo1.de&insecure=0&sni=demo1.de&alpn=h3#USA-HY22`;

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
        expect(proxyGroupSection).not.toContain('# USA-VLESS');
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

        // Should NOT contain VLESS proxy name in groups (it's unsupported)
        // The issue is that the comment string was being added, not the proxy name
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

        // Comment in [Proxy] section is acceptable (informational)
        // This is optional - we may or may not want to keep the comment
        // The key requirement is that it should NOT appear in [Proxy Group]

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
        const vlessOnlyInput = `vless://580ef251-af2b-49f4-aea4-56a8a8f7a391@1.2.3.4:8443?encryption=none&security=reality&type=tcp&sni=example.com&fp=chrome&pbk=testkey&sid=testsid#VLESS-Only`;

        const builder = new SurgeConfigBuilder(
            vlessOnlyInput,
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
            expect(proxyGroupMatch[1]).not.toContain('# VLESS-Only');
        }
    });
});
