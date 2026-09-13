import { afterEach, describe, expect, it, vi } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ProxyParser } from '../src/parsers/ProxyParser.js';
import { parseAnytls } from '../src/parsers/protocols/anytlsParser.js';
import { encodeBase64 } from '../src/utils.js';

const EXTENDED_URI = 'anytls://p%40ss@example.com:8443/?sni=any.example.com&insecure=1&alpn=h2,http%2F1.1&fp=chrome&udp=true&idle-session-check-interval=30&idle_session_timeout=120&min-idle-session=5#ANYTLS%20main';

function mockFetchText(text) {
    vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => text,
        headers: {
            get: () => null
        }
    })));
}

describe('AnyTLS protocol support', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('parses the official URI fields and compatible client extensions', () => {
        expect(parseAnytls(EXTENDED_URI)).toEqual({
            tag: 'ANYTLS main',
            type: 'anytls',
            server: 'example.com',
            server_port: 8443,
            password: 'p@ss',
            udp: true,
            'idle-session-check-interval': 30,
            'idle-session-timeout': 120,
            'min-idle-session': 5,
            tls: {
                enabled: true,
                insecure: true,
                server_name: 'any.example.com',
                alpn: ['h2', 'http/1.1'],
                utls: {
                    enabled: true,
                    fingerprint: 'chrome'
                }
            }
        });
    });

    it('applies the official default port and keeps links without a fragment', () => {
        expect(parseAnytls('anytls://letmein@example.com/?sni=real.example.com&insecure=0')).toEqual({
            tag: 'AnyTLS example.com:443',
            type: 'anytls',
            server: 'example.com',
            server_port: 443,
            password: 'letmein',
            tls: {
                enabled: true,
                insecure: false,
                server_name: 'real.example.com'
            }
        });
    });

    it('parses IPv6 authorities and URL-encoded fragments', () => {
        const result = parseAnytls('anytls://secret@[2409:8a71:6a00:1953::615]:8964/?insecure=1#IPv6%20node');

        expect(result.server).toBe('2409:8a71:6a00:1953::615');
        expect(result.server_port).toBe(8964);
        expect(result.tag).toBe('IPv6 node');
        expect(result.tls.insecure).toBe(true);
    });

    it('registers anytls:// in the generic proxy parser', async () => {
        const result = await ProxyParser.parse(EXTENDED_URI.replace('anytls://', 'ANYTLS://'));

        expect(result.type).toBe('anytls');
        expect(result.tag).toBe('ANYTLS main');
    });

    it('keeps AnyTLS nodes from remote URI subscriptions in Clash output', async () => {
        mockFetchText('anytls://letmein@example.com/?sni=real.example.com');
        const builder = new ClashConfigBuilder(
            'https://subscription.example.com/anytls',
            'minimal',
            [],
            null,
            'zh-CN',
            'mihomo/1.0'
        );
        const config = yaml.load(await builder.build());
        const proxy = config.proxies.find(item => item.type === 'anytls');

        expect(proxy).toMatchObject({
            name: 'AnyTLS example.com:443',
            type: 'anytls',
            server: 'example.com',
            port: 443,
            password: 'letmein',
            udp: true,
            sni: 'real.example.com',
            'skip-cert-verify': false
        });
    });

    it('generates native sing-box AnyTLS fields from Base64 URI subscriptions', async () => {
        const builder = new SingboxConfigBuilder(
            encodeBase64(EXTENDED_URI),
            'minimal',
            [],
            null,
            'zh-CN',
            'sing-box/1.12'
        );
        const config = await builder.build();
        const outbound = config.outbounds.find(item => item.type === 'anytls');

        expect(outbound).toMatchObject({
            tag: 'ANYTLS main',
            type: 'anytls',
            server: 'example.com',
            server_port: 8443,
            password: 'p@ss',
            idle_session_check_interval: '30s',
            idle_session_timeout: '120s',
            min_idle_session: 5,
            tls: {
                enabled: true,
                insecure: true,
                server_name: 'any.example.com',
                alpn: ['h2', 'http/1.1']
            }
        });
        expect(outbound.udp).toBeUndefined();
        expect(outbound).not.toHaveProperty('idle-session-check-interval');
        expect(outbound).not.toHaveProperty('idle-session-timeout');
        expect(outbound).not.toHaveProperty('min-idle-session');
    });

    it('maps sing-box AnyTLS session options into Clash field names', async () => {
        const input = JSON.stringify({
            outbounds: [{
                tag: 'Sing-box AnyTLS',
                type: 'anytls',
                server: 'example.com',
                server_port: 443,
                password: 'secret',
                idle_session_check_interval: 30,
                idle_session_timeout: 120,
                min_idle_session: 5,
                tls: {
                    enabled: true,
                    server_name: 'example.com'
                }
            }]
        });
        const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'mihomo/1.0');
        const config = yaml.load(await builder.build());
        const proxy = config.proxies.find(item => item.type === 'anytls');

        expect(proxy).toMatchObject({
            name: 'Sing-box AnyTLS',
            'idle-session-check-interval': 30,
            'idle-session-timeout': 120,
            'min-idle-session': 5
        });
    });
});
