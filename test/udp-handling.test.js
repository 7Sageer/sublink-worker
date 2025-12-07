import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { parseVless } from '../src/parsers/protocols/vlessParser.js';
import { convertYamlProxyToObject } from '../src/parsers/convertYamlProxyToObject.js';

describe('UDP handling in proxy conversion', () => {
    describe('VLESS URL parsing with udp parameter', () => {
        it('should parse udp=true from VLESS URL', () => {
            const url = 'vless://test-uuid@example.com:443?security=tls&sni=example.com&udp=true#TestVless';
            const result = parseVless(url);

            expect(result.udp).toBe(true);
            expect(result.type).toBe('vless');
            expect(result.tag).toBe('TestVless');
        });

        it('should parse udp=false from VLESS URL', () => {
            const url = 'vless://test-uuid@example.com:443?security=tls&sni=example.com&udp=false#TestVless';
            const result = parseVless(url);

            expect(result.udp).toBe(false);
        });

        it('should not include udp when not specified in URL', () => {
            const url = 'vless://test-uuid@example.com:443?security=tls&sni=example.com#TestVless';
            const result = parseVless(url);

            expect(result.udp).toBeUndefined();
        });
    });

    describe('sing-box output should not contain udp field', () => {
        it('should strip udp field from proxy when converting for sing-box', () => {
            const proxyWithUdp = {
                tag: 'TestProxy',
                type: 'vless',
                server: 'example.com',
                server_port: 443,
                uuid: 'test-uuid',
                udp: true,
                tls: { enabled: true, server_name: 'example.com' }
            };

            const builder = new SingboxConfigBuilder('', [], [], null, 'zh-CN', null);
            const converted = builder.convertProxy(proxyWithUdp);

            expect(converted.udp).toBeUndefined();
            expect(converted.tag).toBe('TestProxy');
            expect(converted.type).toBe('vless');
        });

        it('should move root-level alpn into tls object for sing-box', () => {
            const proxyWithRootAlpn = {
                tag: 'TestProxy',
                type: 'vless',
                server: 'example.com',
                server_port: 443,
                uuid: 'test-uuid',
                alpn: ['h2', 'http/1.1'],
                tls: { enabled: true, server_name: 'example.com' }
            };

            const builder = new SingboxConfigBuilder('', [], [], null, 'zh-CN', null);
            const converted = builder.convertProxy(proxyWithRootAlpn);

            expect(converted.alpn).toBeUndefined();
            expect(converted.tls.alpn).toEqual(['h2', 'http/1.1']);
        });
    });

    describe('Clash output should preserve udp field', () => {
        it('should keep udp field in proxy when converting for Clash', () => {
            const proxyWithUdp = {
                tag: 'TestProxy',
                type: 'vless',
                server: 'example.com',
                server_port: 443,
                uuid: 'test-uuid',
                udp: true,
                tls: { enabled: true, server_name: 'example.com' }
            };

            const builder = new ClashConfigBuilder('', [], [], null, 'zh-CN', null);
            const converted = builder.convertProxy(proxyWithUdp);

            expect(converted.udp).toBe(true);
            expect(converted.name).toBe('TestProxy');
            expect(converted.type).toBe('vless');
        });
    });

    describe('Clash YAML to sing-box conversion should strip udp', () => {
        it('should preserve udp when parsing Clash YAML but strip for sing-box output', () => {
            // Simulate a Clash YAML proxy with udp: true
            const clashProxy = {
                name: 'VLESS-Test',
                type: 'vless',
                server: 'example.com',
                port: 443,
                uuid: 'test-uuid',
                udp: true,
                tls: true,
                servername: 'example.com'
            };

            // Parse the Clash YAML proxy to internal format
            const parsed = convertYamlProxyToObject(clashProxy);

            // Verify the parsed object has udp
            expect(parsed.udp).toBe(true);

            // Now convert it for sing-box
            const builder = new SingboxConfigBuilder('', [], [], null, 'zh-CN', null);
            const singboxProxy = builder.convertProxy(parsed);

            // Verify udp is stripped for sing-box
            expect(singboxProxy.udp).toBeUndefined();
        });
    });
});
