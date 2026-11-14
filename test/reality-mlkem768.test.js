import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { parseVless } from '../src/parsers/protocols/vlessParser.js';
import { convertYamlProxyToObject } from '../src/parsers/convertYamlProxyToObject.js';

// 3x-ui-style share link carrying the mihomo-only REALITY post-quantum flag
const realityUri = (extra) =>
    `vless://test-uuid@example.com:443?security=reality&sni=www.apple.com&fp=chrome&pbk=test-public-key&sid=a1b2c3&flow=xtls-rprx-vision${extra}#TestVless`;

describe('REALITY support-x25519mlkem768 flag', () => {
    describe('URI input', () => {
        it('should parse support-x25519mlkem768=true into tls.reality', () => {
            const result = parseVless(realityUri('&support-x25519mlkem768=true'));

            expect(result.tls.reality.enabled).toBe(true);
            expect(result.tls.reality.public_key).toBe('test-public-key');
            expect(result.tls.reality.support_x25519mlkem768).toBe(true);
        });

        it('should omit the flag when the URI param is absent or not "true"', () => {
            const absent = parseVless(realityUri(''));
            const negative = parseVless(realityUri('&support-x25519mlkem768=false'));

            expect(absent.tls.reality).not.toHaveProperty('support_x25519mlkem768');
            expect(negative.tls.reality).not.toHaveProperty('support_x25519mlkem768');
        });
    });

    describe('Clash YAML input', () => {
        const vlessYaml = (flag) => convertYamlProxyToObject({
            name: 'VLESS-REALITY',
            type: 'vless',
            server: 'example.com',
            port: 443,
            uuid: 'test-uuid',
            tls: true,
            'client-fingerprint': 'chrome',
            'reality-opts': {
                'public-key': 'test-public-key',
                'short-id': 'a1b2c3',
                ...(flag !== undefined && { 'support-x25519mlkem768': flag })
            }
        });

        it('should map reality-opts.support-x25519mlkem768 for vless', () => {
            const result = vlessYaml(true);

            expect(result.tls.reality.support_x25519mlkem768).toBe(true);
        });

        it('should omit the flag for vless when unset', () => {
            const result = vlessYaml(undefined);

            expect(result.tls.reality).not.toHaveProperty('support_x25519mlkem768');
        });

        it('should map the flag for trojan too', () => {
            const result = convertYamlProxyToObject({
                name: 'Trojan-REALITY',
                type: 'trojan',
                server: 'example.com',
                port: 443,
                password: 'test-pass',
                tls: true,
                'reality-opts': {
                    'public-key': 'test-public-key',
                    'short-id': 'a1b2c3',
                    'support-x25519mlkem768': true
                }
            });

            expect(result.tls.reality.support_x25519mlkem768).toBe(true);
        });
    });

    describe('mihomo (Clash) output', () => {
        it('should keep the flag through URI input -> mihomo output', async () => {
            const builder = new ClashConfigBuilder(realityUri('&support-x25519mlkem768=true'), 'minimal', [], null, 'zh-CN', 'test-agent');
            const built = yaml.load(await builder.build());

            const proxy = built.proxies.find(p => p.name === 'TestVless');
            expect(proxy['reality-opts']['support-x25519mlkem768']).toBe(true);
        });

        it('should keep the flag through YAML input -> mihomo output roundtrip', async () => {
            const input = `proxies:
  - name: VLESS-REALITY
    type: vless
    server: example.com
    port: 443
    uuid: test-uuid
    tls: true
    client-fingerprint: chrome
    reality-opts:
      public-key: test-public-key
      short-id: a1b2c3
      support-x25519mlkem768: true`;

            const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
            const built = yaml.load(await builder.build());

            const proxy = built.proxies.find(p => p.name === 'VLESS-REALITY');
            expect(proxy['reality-opts']['support-x25519mlkem768']).toBe(true);
        });

        it('should not emit the flag when absent', async () => {
            const builder = new ClashConfigBuilder(realityUri(''), 'minimal', [], null, 'zh-CN', 'test-agent');
            const built = yaml.load(await builder.build());

            const proxy = built.proxies.find(p => p.name === 'TestVless');
            expect(proxy['reality-opts']).not.toHaveProperty('support-x25519mlkem768');
        });
    });

    describe('sing-box output', () => {
        it('should strip the mihomo-only flag and not mutate the input proxy', () => {
            const proxy = parseVless(realityUri('&support-x25519mlkem768=true'));
            const builder = new SingboxConfigBuilder('', [], [], null, 'zh-CN', null);
            const converted = builder.convertProxy(proxy);

            expect(converted.tls.reality).not.toHaveProperty('support_x25519mlkem768');
            expect(converted.tls.reality.public_key).toBe('test-public-key');
            // convertProxy shallow-copies at the top level, so tls must be rebuilt
            // rather than edited in place to avoid leaking into the source object
            expect(proxy.tls.reality.support_x25519mlkem768).toBe(true);
        });
    });
});
