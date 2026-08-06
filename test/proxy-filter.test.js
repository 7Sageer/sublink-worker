import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { decodeBase64 } from '../src/utils.js';
import {
    filterProxyItems,
    filterProxyUris,
    normalizeExcludedProtocols,
    normalizeExcludedSSMethods,
    shouldExcludeProxy
} from '../src/utils/proxyFilter.js';

describe('proxy filters', () => {
    it('normalizes supported protocols from JSON and comma-separated values', () => {
        expect(normalizeExcludedProtocols('["VMESS","hysteria2","vmess","http"]'))
            .toEqual(['vmess', 'hysteria2']);
        expect(normalizeExcludedProtocols('vless, trojan,unknown'))
            .toEqual(['vless', 'trojan']);
        expect(normalizeExcludedProtocols('{invalid')).toEqual([]);
    });

    it('normalizes ShadowSocks methods without duplicates', () => {
        expect(normalizeExcludedSSMethods(' AES-256-GCM, chacha20-poly1305, aes-256-gcm '))
            .toEqual(['aes-256-gcm', 'chacha20-poly1305']);
    });

    it('filters parsed proxies by protocol and ShadowSocks method', () => {
        const proxies = [
            { type: 'vmess', tag: 'vmess-node' },
            { type: 'shadowsocks', method: 'AES-256-GCM', tag: 'filtered-ss' },
            { type: 'shadowsocks', method: '2022-blake3-aes-128-gcm', tag: 'kept-ss' },
            { type: 'trojan', tag: 'trojan-node' },
            null
        ];

        expect(shouldExcludeProxy(proxies[0], ['VMESS'])).toBe(true);
        expect(filterProxyItems(proxies, ['vmess'], ['aes-256-gcm']))
            .toEqual([proxies[2], proxies[3]]);
    });

    it('filters URI aliases and both SIP002 and legacy ShadowSocks credentials', () => {
        const sip002 = 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@example.com:8388#sip002';
        const legacy = 'ss://YWVzLTEyOC1nY206cGFzc3dvcmRAZXhhbXBsZS5jb206ODM4OA==#legacy';
        const uppercaseScheme = 'SS://YWVzLTI1Ni1nY206cGFzc3dvcmQ@example.com:8388#uppercase';
        const lines = [
            sip002,
            legacy,
            uppercaseScheme,
            'vmess://payload',
            'hy2://password@example.com:443#hy2',
            'hysteria://password@example.com:443#hysteria',
            'trojan://password@example.com:443#trojan'
        ];

        expect(filterProxyUris(lines, ['hysteria2', 'trojan'], ['aes-256-gcm']))
            .toEqual([legacy, 'vmess://payload']);
    });

    it('applies filters to the xray endpoint', async () => {
        const app = createApp({ logger: console });
        const config = [
            'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@example.com:8388#filtered-ss',
            'vless://00000000-0000-0000-0000-000000000000@example.com:443#filtered-vless',
            'trojan://password@example.com:443#kept-trojan'
        ].join('\n');
        const query = new URLSearchParams({
            config,
            excludedProtocols: JSON.stringify(['vless']),
            excludedSSMethods: 'aes-256-gcm'
        });

        const response = await app.request(`http://localhost/xray?${query}`);

        expect(response.status).toBe(200);
        expect(decodeBase64(await response.text()))
            .toBe('trojan://password@example.com:443#kept-trojan');
    });

    it('applies protocol filters to generated client configurations', async () => {
        const app = createApp({ logger: console });
        const config = [
            'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@example.com:8388#filtered-ss',
            'trojan://password@example.com:443?security=tls&type=tcp#kept-trojan'
        ].join('\n');
        const query = new URLSearchParams({
            config,
            excludedProtocols: JSON.stringify(['shadowsocks'])
        });

        const singboxResponse = await app.request(`http://localhost/singbox?${query}`);
        expect(singboxResponse.status).toBe(200);
        const singboxConfig = await singboxResponse.json();
        expect(singboxConfig.outbounds.some(outbound => outbound.type === 'shadowsocks')).toBe(false);
        expect(singboxConfig.outbounds.some(outbound => outbound.type === 'trojan')).toBe(true);

        const clashResponse = await app.request(`http://localhost/clash?${query}`);
        expect(clashResponse.status).toBe(200);
        const clashConfig = await clashResponse.text();
        expect(clashConfig).not.toContain('filtered-ss');
        expect(clashConfig).toContain('kept-trojan');

        const surgeResponse = await app.request(`http://localhost/surge?${query}`);
        expect(surgeResponse.status).toBe(200);
        const surgeConfig = await surgeResponse.text();
        const surgeProxySection = surgeConfig.match(/\[Proxy\]([\s\S]*?)(?=\n\[Proxy Group\])/)?.[1];
        expect(surgeProxySection).not.toContain('filtered-ss');
        expect(surgeProxySection).toContain('kept-trojan');
    });
});
