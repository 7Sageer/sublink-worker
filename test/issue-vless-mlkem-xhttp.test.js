import { describe, it, expect } from 'vitest';
import { parseVless } from '../src/parsers/protocols/vlessParser.js';
import { parseTuic } from '../src/parsers/protocols/tuicParser.js';
import { parseHysteria2 } from '../src/parsers/protocols/hysteria2Parser.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { convertYamlProxyToObject } from '../src/parsers/convertYamlProxyToObject.js';

// Synthetic fixtures only — no real server credentials.
const FAKE_MLKEM_PAYLOAD = 'A'.repeat(1200);
const MLKEM_URL =
  `vless://00000000-0000-4000-8000-000000000001@203.0.113.10:443` +
  `?encryption=mlkem768x25519plus.native.0rtt.${FAKE_MLKEM_PAYLOAD}` +
  `&flow=xtls-rprx-vision&security=reality&sni=example.com&fp=chrome` +
  `&pbk=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` +
  `&sid=0123456789abcdef&type=xhttp&path=test-xh&mode=auto` +
  `#test-mlkem-xhttp`;

const VLESS_WS_URL =
  'vless://00000000-0000-4000-8000-000000000002@203.0.113.20:443' +
  '?encryption=none&security=tls&sni=cdn.example.com&fp=chrome' +
  '&insecure=1&type=ws&host=cdn.example.com&path=%2Fproxy#test-vless-ws';

const TUIC_SECURE_URL =
  'tuic://00000000-0000-4000-8000-000000000003%3Apassword@tuic.example.com:443' +
  '?sni=tuic.example.com&alpn=h3&insecure=0&allowInsecure=0&congestion_control=bbr#test-tuic-secure';

const TUIC_INSECURE_URL =
  'tuic://00000000-0000-4000-8000-000000000004%3Apassword@[2001:db8::1]:60511' +
  '?alpn=h3&insecure=1&allowInsecure=1&congestion_control=bbr#test-tuic-insecure';

const HY2_SECURE_URL =
  'hysteria2://password@hy2.example.com:443' +
  '?sni=hy2.example.com&insecure=0&allowInsecure=0#test-hy2-secure';

function toClash(proxy) {
  return ClashConfigBuilder.prototype.convertProxy.call({}, proxy);
}

describe('VLESS ML-KEM + xhttp conversion', () => {
  it('parses encryption, xhttp mode/path and fingerprint from share link', () => {
    const parsed = parseVless(MLKEM_URL);
    expect(parsed.type).toBe('vless');
    expect(parsed.encryption).toMatch(/^mlkem768x25519plus\.native\.0rtt\./);
    expect(parsed.encryption.length).toBeGreaterThan(1000);
    expect(parsed.flow).toBe('xtls-rprx-vision');
    expect(parsed.transport?.type).toBe('xhttp');
    expect(parsed.transport?.mode).toBe('auto');
    expect(parsed.transport?.path).toBe('/test-xh');
    expect(parsed.tls?.utls?.fingerprint).toBe('chrome');
    expect(parsed.tls?.reality?.public_key).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  });

  it('exports encryption and xhttp-opts for Clash/mihomo', () => {
    const parsed = parseVless(MLKEM_URL);
    const clash = toClash(parsed);
    expect(clash.encryption).toMatch(/^mlkem768x25519plus\.native\.0rtt\./);
    expect(clash.network).toBe('xhttp');
    expect(clash['xhttp-opts']).toEqual(
      expect.objectContaining({
        path: '/test-xh',
        mode: 'auto'
      })
    );
    expect(clash.flow).toBe('xtls-rprx-vision');
    expect(clash['client-fingerprint']).toBe('chrome');
    expect(clash['reality-opts']['public-key']).toBeTruthy();
  });

  it('round-trips Clash YAML encryption and xhttp-opts', () => {
    const yamlProxy = {
      name: 'pq-node',
      type: 'vless',
      server: '203.0.113.10',
      port: 443,
      uuid: '00000000-0000-4000-8000-000000000001',
      encryption: 'mlkem768x25519plus.native.0rtt.abc',
      flow: 'xtls-rprx-vision',
      tls: true,
      servername: 'example.com',
      'client-fingerprint': 'chrome',
      'reality-opts': {
        'public-key': 'pk',
        'short-id': 'sid'
      },
      network: 'xhttp',
      'xhttp-opts': {
        path: '/abc',
        mode: 'auto'
      }
    };
    const obj = convertYamlProxyToObject(yamlProxy);
    expect(obj.encryption).toBe('mlkem768x25519plus.native.0rtt.abc');
    expect(obj.transport?.type).toBe('xhttp');
    expect(obj.transport?.mode).toBe('auto');
    expect(obj.transport?.path).toBe('/abc');
  });
});

describe('TLS insecure flag parsing', () => {
  it('treats insecure=0 as skip-cert-verify false for TUIC', () => {
    const clash = toClash(parseTuic(TUIC_SECURE_URL));
    expect(clash['skip-cert-verify']).toBe(false);
    expect(clash.sni).toBe('tuic.example.com');
    expect(clash['congestion-controller']).toBe('bbr');
  });

  it('treats insecure=1 as skip-cert-verify true for TUIC', () => {
    const clash = toClash(parseTuic(TUIC_INSECURE_URL));
    expect(clash['skip-cert-verify']).toBe(true);
    expect(clash.server).toBe('2001:db8::1');
  });

  it('treats insecure=0 as skip-cert-verify false for Hysteria2', () => {
    const clash = toClash(parseHysteria2(HY2_SECURE_URL));
    expect(clash['skip-cert-verify']).toBe(false);
    expect(clash.sni).toBe('hy2.example.com');
  });

  it('keeps fingerprint and ws-opts for VLESS TLS share links', () => {
    const clash = toClash(parseVless(VLESS_WS_URL));
    expect(clash['client-fingerprint']).toBe('chrome');
    expect(clash.network).toBe('ws');
    expect(clash['ws-opts']?.path).toBe('/proxy');
    expect(clash['skip-cert-verify']).toBe(true);
    // encryption=none should not appear
    expect(clash.encryption).toBeUndefined();
  });
});
