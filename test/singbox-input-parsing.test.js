import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

describe('Sing-Box JSON input parsing', () => {
    const sampleSingboxConfig = JSON.stringify({
        "outbounds": [
            {
                "type": "shadowsocks",
                "tag": "SS-Test",
                "server": "ss.example.com",
                "server_port": 8388,
                "method": "aes-256-gcm",
                "password": "test-password"
            },
            {
                "type": "vless",
                "tag": "VLESS-Test",
                "server": "vless.example.com",
                "server_port": 443,
                "uuid": "12345678-1234-1234-1234-123456789abc",
                "tls": {
                    "enabled": true,
                    "server_name": "vless.example.com"
                }
            },
            {
                "type": "vmess",
                "tag": "VMess-Test",
                "server": "vmess.example.com",
                "server_port": 443,
                "uuid": "87654321-4321-4321-4321-cba987654321",
                "alter_id": 0,
                "security": "auto",
                "tls": {
                    "enabled": true,
                    "server_name": "vmess.example.com"
                },
                "transport": {
                    "type": "ws",
                    "path": "/ws"
                }
            },
            {
                "type": "direct",
                "tag": "DIRECT"
            },
            {
                "type": "block",
                "tag": "REJECT"
            },
            {
                "type": "selector",
                "tag": "节点选择",
                "outbounds": ["SS-Test", "VLESS-Test", "VMess-Test"]
            }
        ],
        "dns": {
            "servers": [
                { "type": "udp", "tag": "dns_direct", "server": "223.5.5.5" }
            ]
        }
    });

    it('should parse Sing-Box JSON input and extract proxy nodes', async () => {
        const builder = new SingboxConfigBuilder(
            sampleSingboxConfig,
            [],
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();
        const proxies = result.outbounds.filter(o => o.server);

        expect(proxies.length).toBe(3);
        expect(proxies.map(p => p.tag)).toContain('SS-Test');
        expect(proxies.map(p => p.tag)).toContain('VLESS-Test');
        expect(proxies.map(p => p.tag)).toContain('VMess-Test');
    });

    it('should filter out non-proxy outbound types (direct, block, selector, urltest)', async () => {
        const builder = new SingboxConfigBuilder(
            sampleSingboxConfig,
            [],
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();
        const proxies = result.outbounds.filter(o => o.server);

        // Should not include DIRECT, REJECT, or selector groups as proxies
        expect(proxies.map(p => p.tag)).not.toContain('DIRECT');
        expect(proxies.map(p => p.tag)).not.toContain('REJECT');
        expect(proxies.map(p => p.tag)).not.toContain('节点选择');
    });

    it('should preserve proxy details like TLS and transport settings', async () => {
        const builder = new SingboxConfigBuilder(
            sampleSingboxConfig,
            [],
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();
        const vmessProxy = result.outbounds.find(o => o.tag === 'VMess-Test');

        expect(vmessProxy).toBeDefined();
        expect(vmessProxy.tls?.enabled).toBe(true);
        expect(vmessProxy.transport?.type).toBe('ws');
        expect(vmessProxy.transport?.path).toBe('/ws');
    });

    it('should work with ClashConfigBuilder as well', async () => {
        const builder = new ClashConfigBuilder(
            sampleSingboxConfig,
            [],
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const resultYaml = await builder.build();
        // ClashConfigBuilder returns YAML string, need to parse it
        const yaml = await import('js-yaml');
        const result = yaml.load(resultYaml);
        const proxies = result.proxies;

        expect(proxies.length).toBe(3);
        // Clash uses 'name' instead of 'tag'
        expect(proxies.map(p => p.name)).toContain('SS-Test');
        expect(proxies.map(p => p.name)).toContain('VLESS-Test');
        expect(proxies.map(p => p.name)).toContain('VMess-Test');
    });

    it('should handle Sing-Box JSON with only outbounds array', async () => {
        const minimalConfig = JSON.stringify({
            "outbounds": [
                {
                    "type": "trojan",
                    "tag": "Trojan-Minimal",
                    "server": "trojan.example.com",
                    "server_port": 443,
                    "password": "trojan-password",
                    "tls": { "enabled": true }
                }
            ]
        });

        const builder = new SingboxConfigBuilder(
            minimalConfig,
            [],
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();
        const proxies = result.outbounds.filter(o => o.server);

        expect(proxies.length).toBe(1);
        expect(proxies[0].tag).toBe('Trojan-Minimal');
        expect(proxies[0].type).toBe('trojan');
    });

    it('should handle hysteria2 and tuic proxy types', async () => {
        const advancedConfig = JSON.stringify({
            "outbounds": [
                {
                    "type": "hysteria2",
                    "tag": "HY2-Test",
                    "server": "hy2.example.com",
                    "server_port": 443,
                    "password": "hy2-password",
                    "tls": {
                        "enabled": true,
                        "server_name": "hy2.example.com"
                    }
                },
                {
                    "type": "tuic",
                    "tag": "TUIC-Test",
                    "server": "tuic.example.com",
                    "server_port": 443,
                    "uuid": "tuic-uuid",
                    "password": "tuic-password",
                    "congestion_control": "bbr",
                    "tls": {
                        "enabled": true,
                        "server_name": "tuic.example.com"
                    }
                }
            ]
        });

        const builder = new SingboxConfigBuilder(
            advancedConfig,
            [],
            [],
            null,
            'zh-CN',
            null,
            false
        );

        const result = await builder.build();
        const proxies = result.outbounds.filter(o => o.server);

        expect(proxies.length).toBe(2);
        expect(proxies.map(p => p.tag)).toContain('HY2-Test');
        expect(proxies.map(p => p.tag)).toContain('TUIC-Test');

        const tuicProxy = proxies.find(p => p.tag === 'TUIC-Test');
        expect(tuicProxy.congestion_control).toBe('bbr');
    });
});
