import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

const UUID = '11111111-2222-3333-4444-555555555555';
const ENC = 'mlkem768x25519plus.native.0rtt.AAAA';
const PBK = 'jNXHt1yRo0vDuchQlIP6Z0ZvjT3KtzVI-T4E7RoLJS0';

async function clashProxies(input) {
    const builder = new ClashConfigBuilder(input, [], [], null, 'en-US', 'clash.meta');
    const config = yaml.load(await builder.build());
    return Object.fromEntries(config.proxies.map(p => [p.name, p]));
}

describe('Clash output keeps VLESS encryption, xhttp and fingerprints', () => {
    const links = [
        `vless://${UUID}@1.2.3.4:443?encryption=${ENC}&security=tls&sni=a.com&fp=firefox&type=xhttp&path=%2Fxh&host=a.com&mode=packet-up#XHTTP`,
        `vless://${UUID}@1.2.3.4:443?encryption=none&security=reality&sni=a.com&pbk=${PBK}&sid=6b&type=splithttp&path=%2Fs#SPLIT`,
        `vless://${UUID}@1.2.3.4:443?security=reality&sni=a.com&pbk=${PBK}&sid=6b#REALITY`,
        `trojan://pw@1.2.3.4:443?sni=a.com&fp=safari#TROJAN`,
    ];

    it('maps share links', async () => {
        const proxies = await clashProxies(links.join('\n'));

        expect(proxies.XHTTP).toMatchObject({
            encryption: ENC,
            network: 'xhttp',
            'xhttp-opts': { path: '/xh', host: 'a.com', mode: 'packet-up' },
            'client-fingerprint': 'firefox',
        });
        expect(proxies.SPLIT.encryption).toBeUndefined();
        expect(proxies.SPLIT.network).toBe('xhttp');
        expect(proxies.REALITY['client-fingerprint']).toBe('chrome');
        expect(proxies.TROJAN['client-fingerprint']).toBe('safari');
    });

    it('round-trips Clash YAML input', async () => {
        const input = yaml.dump({
            proxies: [{
                name: 'YAML-XHTTP', type: 'vless', server: '1.2.3.4', port: 443, uuid: UUID,
                tls: true, servername: 'a.com', encryption: ENC, network: 'xhttp',
                'xhttp-opts': { path: '/xh', host: 'a.com', mode: 'stream-one' },
            }],
        });
        const proxies = await clashProxies(input);

        expect(proxies['YAML-XHTTP']).toMatchObject({
            encryption: ENC,
            network: 'xhttp',
            'xhttp-opts': { path: '/xh', host: 'a.com', mode: 'stream-one' },
        });
    });

    it('sing-box drops VLESS nodes that require encryption it cannot speak', async () => {
        const input = [
            `vless://${UUID}@1.2.3.4:443?encryption=${ENC}&security=reality&sni=a.com&pbk=${PBK}&sid=6b#ENC`,
            `vless://${UUID}@1.2.3.4:443?security=reality&sni=a.com&pbk=${PBK}&sid=6b#PLAIN`,
        ].join('\n');
        const builder = new SingboxConfigBuilder(input, [], [], null, 'en-US', 'test', false, false, undefined, undefined, '1.14');
        const config = await builder.build();
        expect(config.outbounds.filter(o => o.server).map(o => o.tag)).toEqual(['PLAIN']);
    });
});
