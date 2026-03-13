import { describe, it, expect } from 'vitest';
import { generateRules } from '../src/config/ruleGenerators.js';
import { emitClashRules } from '../src/builders/helpers/clashConfigUtils.js';
import { createTranslator } from '../src/i18n/index.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';

describe('SRC-IP-CIDR / source_ip_cidr custom rule support', () => {
    it('generateRules should parse src_ip_cidr into string[]', () => {
        const rules = generateRules('minimal', [
            { name: 'LAN', src_ip_cidr: '192.168.11.13/32, 192.168.10.0/24' }
        ]);

        expect(rules[0].outbound).toBe('LAN');
        expect(rules[0].src_ip_cidr).toEqual(['192.168.11.13/32', '192.168.10.0/24']);
    });

    it('generateRules should treat empty src_ip_cidr as []', () => {
        const rules = generateRules('minimal', [
            { name: 'LAN', src_ip_cidr: ' , , ' }
        ]);

        expect(rules[0].outbound).toBe('LAN');
        expect(rules[0].src_ip_cidr).toEqual([]);
    });

    it('generateRules should accept src_ip_cidr as string[]', () => {
        const rules = generateRules('minimal', [
            { name: 'LAN', src_ip_cidr: [' 192.168.11.13/32 ', '', '192.168.10.0/24'] }
        ]);

        expect(rules[0].outbound).toBe('LAN');
        expect(rules[0].src_ip_cidr).toEqual(['192.168.11.13/32', '192.168.10.0/24']);
    });

    it('emitClashRules should emit SRC-IP-CIDR rules', () => {
        const t = createTranslator('zh-CN');
        const lines = emitClashRules([
            { outbound: 'LAN', src_ip_cidr: ['192.168.11.13/32'] }
        ], t);

        expect(lines).toContain('SRC-IP-CIDR,192.168.11.13/32,LAN');
    });

    it('SingboxConfigBuilder should add source_ip_cidr rules', async () => {
        const input = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1';
        const customRules = [{ name: 'LAN', src_ip_cidr: '192.168.11.13/32' }];

        const builder = new SingboxConfigBuilder(input, 'minimal', customRules, null, 'zh-CN', 'test-agent');
        await builder.build();

        const routeRules = builder.config?.route?.rules || [];
        const hit = routeRules.find(r => Array.isArray(r?.source_ip_cidr) && r.source_ip_cidr.includes('192.168.11.13/32'));
        expect(hit).toBeTruthy();
        expect(hit.outbound).toBe('LAN');
        expect(Object.prototype.hasOwnProperty.call(hit, 'protocol')).toBe(false);
    });

    it('SingboxConfigBuilder should include protocol when specified', async () => {
        const input = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1';
        const customRules = [{ name: 'LAN', src_ip_cidr: '192.168.11.13/32', protocol: 'http' }];

        const builder = new SingboxConfigBuilder(input, 'minimal', customRules, null, 'zh-CN', 'test-agent');
        await builder.build();

        const routeRules = builder.config?.route?.rules || [];
        const hit = routeRules.find(r => Array.isArray(r?.source_ip_cidr) && r.source_ip_cidr.includes('192.168.11.13/32'));
        expect(hit).toBeTruthy();
        expect(hit.outbound).toBe('LAN');
        expect(hit.protocol).toEqual(['http']);
    });

    it('SurgeConfigBuilder should emit SRC-IP rules (best-effort)', async () => {
        const input = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1';
        const customRules = [{ name: 'LAN', src_ip_cidr: '192.168.11.13/32' }];

        const builder = new SurgeConfigBuilder(input, 'minimal', customRules, null, 'zh-CN', 'test-agent');
        const text = await builder.build();

        expect(text).toContain('SRC-IP,192.168.11.13,LAN');
    });

    it('SurgeConfigBuilder should comment and skip non-/32 src_ip_cidr', async () => {
        const input = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1';
        const customRules = [{ name: 'LAN', src_ip_cidr: '192.168.10.0/24' }];

        const builder = new SurgeConfigBuilder(input, 'minimal', customRules, null, 'zh-CN', 'test-agent');
        const text = await builder.build();

        expect(text).toContain('# SRC-IP-CIDR not supported by Surge, skipped: 192.168.10.0/24');
        expect(text).not.toContain('SRC-IP,192.168.10.0/24');
        expect(text).not.toContain('SRC-IP,192.168.10.0,LAN');
    });
});
