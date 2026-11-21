import { describe, expect, it } from 'vitest';
import { parseHysteria2 } from '../src/parsers/protocols/hysteria2Parser.js';
import { parseVless } from '../src/parsers/protocols/vlessParser.js';
import { parseTrojan } from '../src/parsers/protocols/trojanParser.js';
import { parseTuic } from '../src/parsers/protocols/tuicParser.js';

// Share links carry the flag as a string; treating "0" as truthy silently
// disabled certificate verification for nodes that asked for it.
describe('TLS insecure flag in share links', () => {
    const parsers = {
        hysteria2: (q) => parseHysteria2(`hysteria2://pw@1.2.3.4:443?sni=a.com${q}#n`),
        vless: (q) => parseVless(`vless://11111111-2222-3333-4444-555555555555@1.2.3.4:443?security=tls&sni=a.com${q}#n`),
        trojan: (q) => parseTrojan(`trojan://pw@1.2.3.4:443?sni=a.com${q}#n`),
        tuic: (q) => parseTuic(`tuic://11111111-2222-3333-4444-555555555555:pw@1.2.3.4:443?sni=a.com${q}#n`),
    };

    for (const [name, parse] of Object.entries(parsers)) {
        it(`${name}: verifies certificates unless asked not to`, () => {
            expect(parse('').tls.insecure).toBe(false);
            expect(parse('&insecure=0').tls.insecure).toBe(false);
            expect(parse('&allowInsecure=0').tls.insecure).toBe(false);
            expect(parse('&insecure=false').tls.insecure).toBe(false);
            expect(parse('&insecure=1').tls.insecure).toBe(true);
            expect(parse('&allowInsecure=1').tls.insecure).toBe(true);
            expect(parse('&allow_insecure=true').tls.insecure).toBe(true);
        });
    }
});
