import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ProxyParser } from '../src/parsers/ProxyParser.js';

const REALITY_URI = 'vless://00000000-0000-4000-8000-000000000001@node.example.net:443?encryption=none&flow=xtls-rprx-vision&fp=chrome&pbk=TEST_PUBLIC_KEY&security=reality&sid=c94&sni=front.example.org&type=tcp';
const OPTION = 'support-x25519mlkem768';
const CASES = [
    ['true', true],
    ['false', false],
    ['1', true],
    ['0', false],
    ['TRUE', true],
    ['FALSE', false],
    [undefined, undefined],
    ['', undefined],
    ['invalid', undefined]
];

function realityUri(value) {
    return `${REALITY_URI}${value === undefined ? '' : `&${OPTION}=${value}`}#Reality`;
}

describe('VLESS Reality ML-KEM option', () => {
    it.each(CASES)('preserves %s as an optional boolean in Mihomo YAML', async (value, expected) => {
        const uri = realityUri(value);
        const parsed = await ProxyParser.parse(uri);
        const builder = new ClashConfigBuilder(uri, 'minimal', [], null, 'en-US', 'mihomo/1.0');
        const config = yaml.load(await builder.build());

        expect(config.proxies).toHaveLength(1);
        expect(config.proxies[0]).toEqual({
            name: 'Reality',
            type: 'vless',
            server: 'node.example.net',
            port: 443,
            uuid: '00000000-0000-4000-8000-000000000001',
            tls: true,
            'client-fingerprint': 'chrome',
            servername: 'front.example.org',
            network: 'tcp',
            'reality-opts': {
                'public-key': 'TEST_PUBLIC_KEY',
                'short-id': 'c94',
                ...(expected !== undefined ? { [OPTION]: expected } : {})
            },
            tfo: false,
            'skip-cert-verify': false,
            udp: true,
            flow: 'xtls-rprx-vision'
        });
        if (expected === undefined) {
            expect(parsed.tls.reality).not.toHaveProperty('support_x25519mlkem768');
        } else {
            expect(parsed.tls.reality.support_x25519mlkem768).toBe(expected);
        }
    });

    it.each(CASES)('keeps sing-box output unchanged for %s', async (value) => {
        const builder = new SingboxConfigBuilder(realityUri(value), 'minimal', [], null, 'en-US', 'sing-box/1.12');
        const config = await builder.build();
        const outbound = config.outbounds.find(item => item.type === 'vless');
        const legacyProxy = await ProxyParser.parse(realityUri());

        expect(outbound).toEqual(legacyProxy);
        expect(outbound.tls.reality).not.toHaveProperty('support_x25519mlkem768');
        expect(outbound.tls.reality).not.toHaveProperty(OPTION);
    });

    it('does not mutate the parsed Reality options when building sing-box output', async () => {
        const parsed = await ProxyParser.parse(realityUri('true'));
        const builder = new SingboxConfigBuilder('', 'minimal', [], null, 'en-US');

        builder.convertProxy(parsed);

        expect(parsed.tls.reality.support_x25519mlkem768).toBe(true);
    });

    it('ignores the Reality option for ordinary TLS links', async () => {
        const uri = realityUri('true').replace('security=reality', 'security=tls');
        const parsed = await ProxyParser.parse(uri);
        const builder = new ClashConfigBuilder(uri, 'minimal', [], null, 'en-US');
        const config = yaml.load(await builder.build());

        expect(parsed.tls).not.toHaveProperty('reality');
        expect(config.proxies[0]).not.toHaveProperty('reality-opts');
    });

    it.each([['true', true], ['false', false], [undefined, undefined]])(
        'uses the same Reality option mapping for Trojan (%s)', async (value, expected) => {
            const uri = realityUri(value).replace('vless://', 'trojan://');
            const builder = new ClashConfigBuilder(uri, 'minimal', [], null, 'en-US');
            const config = yaml.load(await builder.build());

            expect(config.proxies[0]['reality-opts']).toEqual({
                'public-key': 'TEST_PUBLIC_KEY',
                'short-id': 'c94',
                ...(expected !== undefined ? { [OPTION]: expected } : {})
            });
        }
    );
});
