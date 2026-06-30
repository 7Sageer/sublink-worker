import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

/**
 * Companion to the #297 follow-up: when a user toggled clash_mode=global, DNS
 * UDP packets matched the clash_mode rule before hijack-dns and were dispatched
 * to a selector, which then failed on UDP because every node had been emitted
 * with `network: "tcp"`. The selector failure is fixed elsewhere by dropping
 * the bad field; this test pins the route ordering so even a future global-mode
 * toggle keeps DNS on the hijack path.
 */
describe('sing-box route.rules: hijack-dns precedes clash_mode rules', () => {
    const vlessUrl = 'vless://12345678-1234-1234-1234-123456789abc@example.com:443?security=tls&sni=example.com#TestVless';

    it('hijack-dns sits before any clash_mode rule', async () => {
        const builder = new SingboxConfigBuilder(vlessUrl, [], [], null, 'zh-CN', null, false);
        const result = await builder.build();
        const rules = result.route.rules;

        const dnsHijackIdx = rules.findIndex(r => r.action === 'hijack-dns' && r.protocol === 'dns');
        const firstClashModeIdx = rules.findIndex(r => r.clash_mode);

        expect(dnsHijackIdx).toBeGreaterThanOrEqual(0);
        expect(firstClashModeIdx).toBeGreaterThanOrEqual(0);
        expect(dnsHijackIdx).toBeLessThan(firstClashModeIdx);
    });

    it('sniff action is present and precedes hijack-dns', async () => {
        const builder = new SingboxConfigBuilder(vlessUrl, [], [], null, 'zh-CN', null, false);
        const result = await builder.build();
        const rules = result.route.rules;

        const sniffIdx = rules.findIndex(r => r.action === 'sniff' && !r.protocol);
        const dnsHijackIdx = rules.findIndex(r => r.action === 'hijack-dns');

        expect(sniffIdx).toBeGreaterThanOrEqual(0);
        expect(sniffIdx).toBeLessThan(dnsHijackIdx);
    });
});
