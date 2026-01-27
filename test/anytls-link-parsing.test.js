import { describe, it, expect } from 'vitest';
import { ProxyParser } from '../src/parsers/ProxyParser.js';

describe('AnyTLS link parsing', () => {
    it('parses basic anytls:// link with tls and params', async () => {
        const url = 'anytls://passw0rd@example.com:443?udp=true&sni=example.com&alpn=h2,http/1.1&skip-cert-verify=true&client-fingerprint=chrome&idle-session-check-interval=30&idle-session-timeout=60&min-idle-session=1#AnyTLS-Node';

        const result = await ProxyParser.parse(url);
        expect(result).toBeTruthy();
        expect(result.type).toBe('anytls');
        expect(result.tag).toBe('AnyTLS-Node');
        expect(result.server).toBe('example.com');
        expect(result.server_port).toBe(443);
        expect(result.password).toBe('passw0rd');
        expect(result.udp).toBe(true);

        expect(result.tls).toMatchObject({
            enabled: true,
            server_name: 'example.com',
            insecure: true,
            alpn: ['h2', 'http/1.1'],
            utls: { enabled: true, fingerprint: 'chrome' }
        });

        expect(result['idle-session-check-interval']).toBe(30);
        expect(result['idle-session-timeout']).toBe(60);
        expect(result['min-idle-session']).toBe(1);
    });
});

