import { describe, expect, it } from 'vitest';
import { LoonConfigBuilder } from '../src/builders/LoonConfigBuilder.js';

function createBuilder() {
    return new LoonConfigBuilder('', [], [], null, 'en-US', 'Loon/3.2', false);
}

describe('LoonConfigBuilder', () => {
    it('converts the proxy protocols supported by Loon', () => {
        const builder = createBuilder();

        expect(builder.convertProxy({
            type: 'shadowsocks',
            tag: 'SS',
            server: 'ss.example.com',
            server_port: 443,
            method: 'aes-128-gcm',
            password: 'secret',
            plugin: 'obfs',
            plugin_opts: { mode: 'http', host: 'cdn.example.com', path: '/' },
            udp: true
        })).toBe('SS = Shadowsocks, ss.example.com, 443, aes-128-gcm, "secret", obfs-name=http, obfs-host=cdn.example.com, obfs-uri=/, udp=true');

        expect(builder.convertProxy({
            type: 'vmess',
            tag: 'VMess',
            server: 'vmess.example.com',
            server_port: 443,
            security: 'auto',
            uuid: 'vmess-uuid',
            alter_id: 0,
            transport: { type: 'ws', path: '/ws', headers: { host: 'edge.example.com' } },
            tls: { enabled: true, server_name: 'vmess.example.com', insecure: true }
        })).toBe('VMess = vmess, vmess.example.com, 443, auto, "vmess-uuid", transport=ws, path=/ws, host=edge.example.com, over-tls=true, skip-cert-verify=true, tls-name=vmess.example.com, alterId=0');

        expect(builder.convertProxy({
            type: 'vless',
            tag: 'VLESS Reality',
            server: 'vless.example.com',
            server_port: 443,
            uuid: 'vless-uuid',
            flow: 'xtls-rprx-vision',
            tls: {
                enabled: true,
                server_name: 'www.microsoft.com',
                reality: { enabled: true, public_key: 'public-key', short_id: '01234567' }
            }
        })).toBe('VLESS Reality = vless, vless.example.com, 443, "vless-uuid", transport=tcp, over-tls=true, sni=www.microsoft.com, public-key="public-key", short-id=01234567, flow=xtls-rprx-vision');

        expect(builder.convertProxy({
            type: 'trojan',
            tag: 'Trojan',
            server: 'trojan.example.com',
            server_port: 443,
            password: 'trojan-pass',
            tls: { enabled: true, server_name: 'trojan.example.com' }
        })).toBe('Trojan = trojan, trojan.example.com, 443, "trojan-pass", tls-name=trojan.example.com');

        expect(builder.convertProxy({
            type: 'hysteria2',
            tag: 'HY2',
            server: 'hy2.example.com',
            server_port: 8443,
            password: 'hy2-pass',
            tls: { enabled: true, server_name: 'hy2.example.com' },
            obfs: { type: 'salamander', password: 'obfs-pass' },
            ports: '8443,10000-20000',
            hop_interval: 30,
            down: '100 Mbps'
        })).toBe('HY2 = Hysteria2, hy2.example.com, 8443, "hy2-pass", server-ports="8443,10000-20000", hop-interval=30, tls-name=hy2.example.com, salamander-password="obfs-pass", udp=true, download-bandwidth=100');

        expect(builder.convertProxy({
            type: 'anytls',
            tag: 'AnyTLS',
            server: 'anytls.example.com',
            server_port: 443,
            password: 'anytls-pass',
            udp: true,
            'idle-session-timeout': 120,
            tls: { enabled: true, server_name: 'anytls.example.com', alpn: ['h2', 'http/1.1'] }
        })).toBe('AnyTLS = anytls, anytls.example.com, 443, "anytls-pass", idle-session-timeout=120, alpn="h2,http/1.1", tls-name=anytls.example.com, udp=true');
    });

    it('marks unsupported proxy types and excludes them from policy groups', () => {
        const builder = createBuilder();
        const line = builder.convertProxy({ type: 'tuic', tag: 'TUIC' });

        expect(line).toBe('# TUIC - Unsupported by Loon: tuic');
        builder.addProxyToConfig(line);
        expect(builder.getValidProxies()).toEqual([]);
    });

    it('builds a complete Loon config with remote rules', async () => {
        const input = 'ss://YWVzLTEyOC1nY206c2VjcmV0@ss.example.com:443#Loon-SS';
        const builder = new LoonConfigBuilder(
            input,
            ['Google'],
            [{ name: 'Custom', site: '', ip: '', domain_suffix: 'example.com' }],
            null,
            'en-US',
            'Loon/3.2',
            false
        );

        const output = await builder.build();

        expect(output).toContain('[General]');
        expect(output).toContain('[Proxy]');
        expect(output).toContain('Loon-SS = Shadowsocks, ss.example.com, 443, aes-128-gcm, "secret"');
        expect(output).toContain('[Proxy Group]');
        expect(output).toContain('[Remote Rule]');
        expect(output).toContain('/geosite/google.conf, 🔍 Google Services');
        expect(output).toContain('/geoip/google.txt, 🔍 Google Services');
        expect(output).toContain('DOMAIN-SUFFIX,example.com,Custom');
        expect(output).toContain('FINAL,🐟 Fall Back');
    });
});
