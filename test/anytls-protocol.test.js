import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ProxyParser } from '../src/parsers/index.js';
import { parseAnytls } from '../src/parsers/protocols/anytlsParser.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

describe('AnyTLS protocol support', () => {
    const url = 'anytls://p%40ss@example.com:443?sni=any.example.com&alpn=h2,http/1.1&client-fingerprint=chrome&skip-cert-verify=true&udp=true&idle-session-check-interval=30&idle-session-timeout=120&min-idle-session=5#ANYTLS-main';

    it('parses AnyTLS URLs', () => {
        const result = parseAnytls(url);

        expect(result).toEqual({
            tag: 'ANYTLS-main',
            type: 'anytls',
            server: 'example.com',
            server_port: 443,
            password: 'p@ss',
            udp: true,
            'idle-session-check-interval': 30,
            'idle-session-timeout': 120,
            'min-idle-session': 5,
            tls: {
                enabled: true,
                server_name: 'any.example.com',
                insecure: true,
                alpn: ['h2', 'http/1.1'],
                utls: {
                    enabled: true,
                    fingerprint: 'chrome'
                }
            }
        });
    });

    it('registers AnyTLS in the generic proxy parser', async () => {
        const result = await ProxyParser.parse(url);

        expect(result.type).toBe('anytls');
        expect(result.tag).toBe('ANYTLS-main');
    });

    it('emits AnyTLS outbounds for sing-box', async () => {
        const builder = new SingboxConfigBuilder(url, [], [], null, 'zh-CN', null);
        const config = await builder.build();
        const outbound = config.outbounds.find(item => item.tag === 'ANYTLS-main');

        expect(outbound).toMatchObject({
            tag: 'ANYTLS-main',
            type: 'anytls',
            server: 'example.com',
            server_port: 443,
            password: 'p@ss',
            tls: {
                enabled: true,
                server_name: 'any.example.com',
                insecure: true,
                alpn: ['h2', 'http/1.1']
            }
        });
        expect(outbound.udp).toBeUndefined();
    });

    it('emits AnyTLS proxies for Clash', async () => {
        const builder = new ClashConfigBuilder(url, 'minimal', [], null, 'zh-CN', null);
        const config = yaml.load(await builder.build());
        const proxy = config.proxies.find(item => item.name === 'ANYTLS-main');

        expect(proxy).toMatchObject({
            name: 'ANYTLS-main',
            type: 'anytls',
            server: 'example.com',
            port: 443,
            password: 'p@ss',
            udp: true,
            sni: 'any.example.com',
            'skip-cert-verify': true,
            alpn: ['h2', 'http/1.1'],
            'client-fingerprint': 'chrome',
            'idle-session-check-interval': 30,
            'idle-session-timeout': 120,
            'min-idle-session': 5
        });
    });
});
