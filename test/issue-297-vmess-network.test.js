import { describe, it, expect } from 'vitest';
import { parseVmess } from '../src/parsers/protocols/vmessParser.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

/**
 * Issue #297: Singbox 订阅无法导入
 *
 * 问题：VMess 使用 WebSocket 传输时，network 字段被错误设置为 'ws'
 * 错误信息：unknown net: ws
 *
 * Sing-Box 的 network 字段只接受 'tcp' 或 'udp'
 * WebSocket 应该只在 transport 对象中配置
 */
describe('Issue #297: VMess network field should be tcp/udp only', () => {
    // Base64 encoded VMess config with WebSocket transport
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

    it('parseVmess should set network to tcp for WebSocket transport', () => {
        const result = parseVmess(vmessWsUrl);

        // network 字段应该是 'tcp'，不是 'ws'
        expect(result.network).toBe('tcp');

        // transport.type 应该是 'ws'
        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('ws');
        expect(result.transport.path).toBe('/ws');
    });

    it('parseVmess should set network to tcp for gRPC transport', () => {
        const vmessGrpcConfig = {
            ...vmessWsConfig,
            ps: 'VMess-gRPC-Test',
            net: 'grpc',
            path: 'grpc-service'
        };
        const vmessGrpcUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessGrpcConfig)).toString('base64');

        const result = parseVmess(vmessGrpcUrl);

        expect(result.network).toBe('tcp');
        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('grpc');
    });

    it('parseVmess should set network to tcp for HTTP transport', () => {
        const vmessHttpConfig = {
            ...vmessWsConfig,
            ps: 'VMess-HTTP-Test',
            net: 'http',
            path: '/http'
        };
        const vmessHttpUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessHttpConfig)).toString('base64');

        const result = parseVmess(vmessHttpUrl);

        expect(result.network).toBe('tcp');
        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('http');
    });

    it('parseVmess should set network to tcp for H2 transport', () => {
        const vmessH2Config = {
            ...vmessWsConfig,
            ps: 'VMess-H2-Test',
            net: 'h2',
            path: '/h2'
        };
        const vmessH2Url = 'vmess://' + Buffer.from(JSON.stringify(vmessH2Config)).toString('base64');

        const result = parseVmess(vmessH2Url);

        expect(result.network).toBe('tcp');
        expect(result.transport).toBeDefined();
        expect(result.transport.type).toBe('h2');
    });

    it('parseVmess should set network to tcp for plain TCP (no transport)', () => {
        const vmessTcpConfig = {
            ...vmessWsConfig,
            ps: 'VMess-TCP-Test',
            net: 'tcp',
            type: 'none'
        };
        const vmessTcpUrl = 'vmess://' + Buffer.from(JSON.stringify(vmessTcpConfig)).toString('base64');

        const result = parseVmess(vmessTcpUrl);

        expect(result.network).toBe('tcp');
        // Plain TCP should not have transport object
        expect(result.transport).toBeUndefined();
    });

    it('SingboxConfigBuilder should output valid network field for VMess with WS', async () => {
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
        // network 必须是 'tcp' 或 'udp'，不能是 'ws'
        expect(['tcp', 'udp', undefined]).toContain(vmessProxy.network);
        expect(vmessProxy.network).not.toBe('ws');
        expect(vmessProxy.network).not.toBe('grpc');
        expect(vmessProxy.network).not.toBe('http');
        expect(vmessProxy.network).not.toBe('h2');

        // transport 配置应该正确
        expect(vmessProxy.transport?.type).toBe('ws');
    });
});
