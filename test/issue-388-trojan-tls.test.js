import { describe, expect, it } from 'vitest';
import { parseTrojan } from '../src/parsers/protocols/trojanParser.js';

// Trojan-over-TLS is required by protocol design. When the URL omits the
// `security` param, sing-box would receive `tls.enabled = false` and fail to
// start the outbound. See issue #388.
describe('Issue #388 - trojan defaults to TLS when security param omitted', () => {
    it('enables TLS when security param is absent', () => {
        const url = 'trojan://pass@example.com:443?allowInsecure=1&peer=www.apple.com.cn&sni=www.apple.com.cn&type=tcp#JP-03';
        const result = parseTrojan(url);

        expect(result.type).toBe('trojan');
        expect(result.tls.enabled).toBe(true);
        expect(result.tls.server_name).toBe('www.apple.com.cn');
        expect(result.tls.insecure).toBe(true);
    });

    it('keeps TLS enabled when security=tls is explicit', () => {
        const url = 'trojan://pass@example.com:443?security=tls&sni=example.org#explicit-tls';
        const result = parseTrojan(url);

        expect(result.tls.enabled).toBe(true);
        expect(result.tls.server_name).toBe('example.org');
    });

    it('respects security=none when explicitly set', () => {
        const url = 'trojan://pass@example.com:443?security=none#no-tls';
        const result = parseTrojan(url);

        expect(result.tls.enabled).toBe(false);
    });
});
