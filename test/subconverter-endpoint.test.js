import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { PREDEFINED_RULE_SETS } from '../src/config/index.js';

const createTestApp = (overrides = {}) => {
    const runtime = {
        kv: overrides.kv ?? new MemoryKVAdapter(),
        assetFetcher: overrides.assetFetcher ?? null,
        logger: console,
        config: {
            configTtlSeconds: 60,
            shortLinkTtlSeconds: null,
            ...(overrides.config || {})
        }
    };
    return createApp(runtime);
};

describe('GET /subconverter', () => {
    it('returns text/plain with INI format', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/subconverter');
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/plain');
        const text = await res.text();
        expect(text).toContain('[custom]');
        expect(text).toContain('enable_rule_generator=true');
        expect(text).toContain('overwrite_original_rules=true');
    });

    it('defaults to balanced preset when no selectedRules provided', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/subconverter');
        const text = await res.text();

        // balanced preset includes Google, Youtube, AI Services, Telegram, etc.
        PREDEFINED_RULE_SETS.balanced.forEach(ruleName => {
            // Each selected rule should produce at least one ruleset line
            // (either GEOSITE or GEOIP)
            expect(text).toMatch(/ruleset=/);
        });

        // Check for specific rules from balanced set
        expect(text).toContain('GEOSITE,google');
        expect(text).toContain('GEOSITE,youtube');
        expect(text).toContain('GEOIP,telegram');
    });

    it('accepts minimal preset', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/subconverter?selectedRules=minimal');
        const text = await res.text();

        // minimal: Location:CN, Private, Non-China
        expect(text).toContain('GEOSITE,geolocation-cn');
        expect(text).toContain('GEOIP,private');
        expect(text).toContain('GEOSITE,geolocation-!cn');

        // Should NOT contain rules outside minimal
        expect(text).not.toContain('GEOSITE,google');
        expect(text).not.toContain('GEOSITE,youtube');
    });

    it('accepts comprehensive preset', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/subconverter?selectedRules=comprehensive');
        const text = await res.text();

        // comprehensive includes all rules
        expect(text).toContain('GEOSITE,category-ads-all');
        expect(text).toContain('GEOSITE,category-ai-!cn');
        expect(text).toContain('GEOSITE,google');
        expect(text).toContain('GEOSITE,bilibili');
        expect(text).toContain('GEOSITE,youtube');
        expect(text).toContain('GEOSITE,netflix');
        expect(text).toContain('GEOSITE,steam');
        expect(text).toContain('GEOIP,telegram');
    });

    it('accepts JSON array for selectedRules', async () => {
        const app = createTestApp();
        const rules = JSON.stringify(['Google', 'Telegram']);
        const res = await app.request(`http://localhost/subconverter?selectedRules=${encodeURIComponent(rules)}`);
        const text = await res.text();

        expect(text).toContain('GEOSITE,google');
        expect(text).toContain('GEOIP,google');
        expect(text).toContain('GEOIP,telegram');

        // Should NOT contain rules not selected
        expect(text).not.toContain('GEOSITE,youtube');
        expect(text).not.toContain('GEOSITE,bilibili');
    });

    it('generates correct proxy group structure', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/subconverter?selectedRules=minimal');
        const text = await res.text();

        // Node Select and Auto Select groups
        expect(text).toMatch(/custom_proxy_group=.*节点选择.*select/);
        expect(text).toMatch(/custom_proxy_group=.*自动选择.*url-test/);

        // Fall Back group
        expect(text).toMatch(/custom_proxy_group=.*漏网之鱼.*select/);

        // FINAL rule
        expect(text).toContain('[]FINAL');
    });

    it('maps Ad Block to REJECT', async () => {
        const app = createTestApp();
        const rules = JSON.stringify(['Ad Block', 'Google']);
        const res = await app.request(`http://localhost/subconverter?selectedRules=${encodeURIComponent(rules)}`);
        const text = await res.text();

        // Ad Block group should have REJECT as first option
        expect(text).toMatch(/custom_proxy_group=.*广告拦截.*select.*\[]REJECT/);
    });

    it('maps Private and Location:CN to DIRECT', async () => {
        const app = createTestApp();
        const rules = JSON.stringify(['Private', 'Location:CN', 'Google']);
        const res = await app.request(`http://localhost/subconverter?selectedRules=${encodeURIComponent(rules)}`);
        const text = await res.text();

        // Private group should have DIRECT as first option
        expect(text).toMatch(/custom_proxy_group=.*私有网络.*select.*\[]DIRECT/);
        // Location:CN group should have DIRECT as first option
        expect(text).toMatch(/custom_proxy_group=.*国内服务.*select.*\[]DIRECT/);
    });

    it('maps other rules to Node Select', async () => {
        const app = createTestApp();
        const rules = JSON.stringify(['Google']);
        const res = await app.request(`http://localhost/subconverter?selectedRules=${encodeURIComponent(rules)}`);
        const text = await res.text();

        // Google group should reference Node Select
        expect(text).toMatch(/custom_proxy_group=.*谷歌服务.*select.*\[].*节点选择/);
    });

    it('respects include_auto_select=false', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/subconverter?selectedRules=minimal&include_auto_select=false');
        const text = await res.text();

        // Should NOT have Auto Select group
        expect(text).not.toMatch(/custom_proxy_group=.*自动选择.*url-test/);

        // Node Select should not reference Auto Select
        const nodeSelectLine = text.split('\n').find(l => l.includes('节点选择') && l.includes('custom_proxy_group'));
        expect(nodeSelectLine).toBeDefined();
        expect(nodeSelectLine).not.toContain('自动选择');
    });

    it('orders domain rules before IP rules', async () => {
        const app = createTestApp();
        const rules = JSON.stringify(['Google']);
        const res = await app.request(`http://localhost/subconverter?selectedRules=${encodeURIComponent(rules)}`);
        const text = await res.text();

        const geositeLine = text.indexOf('GEOSITE,google');
        const geoipLine = text.indexOf('GEOIP,google');

        expect(geositeLine).toBeGreaterThan(-1);
        expect(geoipLine).toBeGreaterThan(-1);
        expect(geositeLine).toBeLessThan(geoipLine);
    });

    it('supports lang parameter for i18n', async () => {
        const app = createTestApp();
        const res = await app.request('http://localhost/subconverter?selectedRules=minimal&lang=en');
        const text = await res.text();

        // English translations
        expect(text).toContain('Node Select');
        expect(text).toContain('Auto Select');
        expect(text).toContain('Fall Back');
    });

    describe('group_by_country=true', () => {
        it('generates country groups with regex patterns', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=minimal&group_by_country=true');
            const text = await res.text();

            // Should contain country url-test groups with (?i) flag and \b boundaries for ASCII aliases
            expect(text).toMatch(/custom_proxy_group=🇭🇰 Hong Kong`url-test`\(\?i\)\(香港\|\\bHong Kong\\b\|\\bHK\\b\)/);
            expect(text).toMatch(/custom_proxy_group=🇯🇵 Japan`url-test`\(\?i\)\(日本\|\\bJapan\\b\|\\bJP\\b\)/);
            expect(text).toMatch(/custom_proxy_group=🇺🇸 United States`url-test`\(\?i\)\(美国\|\\bUnited States\\b\|\\bUS\\b\)/);
        });

        it('generates Manual Switch group with all nodes', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=minimal&group_by_country=true');
            const text = await res.text();

            // Manual Switch group should select all nodes
            expect(text).toMatch(/custom_proxy_group=.*手动切换.*`select`\.\*/);
        });

        it('Node Select references country groups instead of .*', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=minimal&group_by_country=true');
            const text = await res.text();

            const nodeSelectLine = text.split('\n').find(l => l.includes('节点选择') && l.includes('`select`'));
            expect(nodeSelectLine).toBeDefined();

            // Should reference country groups
            expect(nodeSelectLine).toContain('[]🇭🇰 Hong Kong');
            expect(nodeSelectLine).toContain('[]🇯🇵 Japan');

            // Should NOT end with .*  (individual node matching)
            expect(nodeSelectLine).not.toMatch(/\.\*$/);
            expect(nodeSelectLine).not.toMatch(/`\.\*`/);
        });

        it('outbound groups reference country groups when groupByCountry', async () => {
            const app = createTestApp();
            const rules = JSON.stringify(['Google']);
            const res = await app.request(`http://localhost/subconverter?selectedRules=${encodeURIComponent(rules)}&group_by_country=true`);
            const text = await res.text();

            const googleLine = text.split('\n').find(l => l.includes('谷歌服务') && l.includes('`select`'));
            expect(googleLine).toBeDefined();
            expect(googleLine).toContain('[]🇭🇰 Hong Kong');
            expect(googleLine).toContain('[]🇺🇸 United States');
            expect(googleLine).not.toMatch(/`\.\*/);
        });

        it('works with groupByCountry and include_auto_select=false', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=minimal&group_by_country=true&include_auto_select=false');
            const text = await res.text();

            // Should NOT have Auto Select
            expect(text).not.toMatch(/custom_proxy_group=.*自动选择.*url-test/);

            // Node Select should reference Manual Switch and country groups but NOT Auto Select
            const nodeSelectLine = text.split('\n').find(l => l.includes('节点选择') && l.includes('`select`'));
            expect(nodeSelectLine).toBeDefined();
            expect(nodeSelectLine).toContain('手动切换');
            expect(nodeSelectLine).not.toContain('自动选择');
        });

        it('generates all 30 country groups', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=minimal&group_by_country=true');
            const text = await res.text();

            const countryGroupCount = (text.match(/custom_proxy_group=.+`url-test`\(\?i\)\(.+\)`http/g) || []).length;
            expect(countryGroupCount).toBe(30);
        });

        it('uses English group names with lang=en', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=minimal&group_by_country=true&lang=en');
            const text = await res.text();

            expect(text).toContain('Manual Switch');
            expect(text).toContain('Node Select');
            // Country groups should still appear
            expect(text).toContain('🇯🇵 Japan');
        });
    });

    describe('invalid selectedRules', () => {
        it('returns 400 for invalid preset name', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=balancde');
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain('Invalid selectedRules');
            expect(text).toContain('balancde');
        });

        it('returns 400 for non-JSON non-preset string', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=foobar');
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain('Invalid selectedRules');
        });

        it('returns 400 for JSON object (not array)', async () => {
            const app = createTestApp();
            const obj = JSON.stringify({ rule: 'Google' });
            const res = await app.request(`http://localhost/subconverter?selectedRules=${encodeURIComponent(obj)}`);
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain('must be a preset name');
        });

        it('defaults to balanced when selectedRules is not provided', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter');
            expect(res.status).toBe(200);
            const text = await res.text();
            // balanced preset includes Google and Youtube
            expect(text).toContain('GEOSITE,google');
            expect(text).toContain('GEOSITE,youtube');
        });
    });
});
