import { describe, it, expect } from 'vitest';
import { parseVmess } from '../src/parsers/protocols/vmessParser.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

/**
 * Issue #297 (follow-up): the original fix hardcoded `network: 'tcp'` on every
 * parsed proxy so sing-box would stop seeing transport names like 'ws' in that
 * slot. That value is harmless in Clash but in sing-box `network` is a TCP/UDP
 * allowlist (option/types.go NetworkList), and "tcp" silently disables UDP —
 * breaking DNS hijack, fakeip, QUIC, and any selector that picks the node.
 *
 * The proper fix is to never emit a top-level `network` in sing-box output and
 * let it default to ["tcp","udp"]. Transport info lives in `transport.type`.
 */
describe('Issue #297: sing-box outbounds must not carry a top-level `network`', () => {
    const vmessWsConfig = {
        v: '2',
        ps: 'VMess-WS-Test',
        add: 'vmess.example.com',
        port: '443',
        id: '12345678-1234-1234-1234-123456789abc',
        aid: '0',
        scy: 'auto',
        net: 'ws',
        type: 'none',
        host: 'vmess.example.com',
        path: '/ws',
        tls: 'tls',
        sni: 'vmess.example.com'
    };

    const vmessWsUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessWsConfig)).toString('base64');

    it('parseVmess should not emit a top-level network field for WebSocket transport', () => {
        const result = parseVmess(vmessWsUrl);

        expect(result.network).toBeUndefined();

        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('ws');
        expect(result.transport.path).toBe('/ws');
    });

    it('parseVmess should not emit a top-level network field for gRPC transport', () => {
        const vmessGrpcConfig = {
            ...vmessWsConfig,
            ps: 'VMess-gRPC-Test',
            net: 'grpc',
            path: 'grpc-service'
        };
        const vmessGrpcUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessGrpcConfig)).toString('base64');

        const result = parseVmess(vmessGrpcUrl);

        expect(result.network).toBeUndefined();
        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('grpc');
    });

    it('parseVmess should not emit a top-level network field for HTTP transport', () => {
        const vmessHttpConfig = {
            ...vmessWsConfig,
            ps: 'VMess-HTTP-Test',
            net: 'http',
            path: '/http'
        };
        const vmessHttpUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessHttpConfig)).toString('base64');

        const result = parseVmess(vmessHttpUrl);

        expect(result.network).toBeUndefined();
        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('http');
    });

    it('parseVmess should not emit a top-level network field for H2 transport', () => {
        const vmessH2Config = {
            ...vmessWsConfig,
            ps: 'VMess-H2-Test',
            net: 'h2',
            path: '/h2'
        };
        const vmessH2Url = 'vmess://' + Buffer.from(JSON.stringify(vmessH2Config)).toString('base64');

        const result = parseVmess(vmessH2Url);

        expect(result.network).toBeUndefined();
        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('h2');
    });

    it('parseVmess should not emit a top-level network field for plain TCP (no transport)', () => {
        const vmessTcpConfig = {
            ...vmessWsConfig,
            ps: 'VMess-TCP-Test',
            net: 'tcp',
            type: 'none'
        };
        const vmessTcpUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessTcpConfig)).toString('base64');

        const result = parseVmess(vmessTcpUrl);

        expect(result.network).toBeUndefined();
        expect(result.transport).toBeUndefined();
    });

    it('SingboxConfigBuilder must not emit network on VMess outbound with WS transport', async () => {
        const builder = new SingboxConfigBuilder(
            vmessWsUrl,
            [],
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();
        const vmessProxy = result.outbounds.find(o => o.tag === 'VMess-WS-Test');

        expect(vmessProxy).toBeDefined();
        expect(vmessProxy.network).toBeUndefined();
        expect(vmessProxy.transport?.type).toBe('ws');
    });
});
