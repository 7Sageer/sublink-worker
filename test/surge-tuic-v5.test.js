import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import { convertSurgeProxyToObject } from '../src/parsers/convertSurgeProxyToObject.js';
import { parseSurgeIni } from '../src/parsers/subscription/subscriptionContentParser.js';

const uuid = '00000000-0000-4000-8000-000000000001';
const proxy = {
    type: 'tuic',
    tag: 'TUIC-Test',
    server: 'tuic.example.com',
    server_port: 443,
    uuid,
    password: 'synthetic-password',
    congestion_control: 'bbr',
    udp_relay_mode: 'native',
    tls: {
        enabled: true,
        server_name: 'tuic.example.com',
        alpn: ['h3'],
        insecure: true
    }
};

const inputs = [
    {
        format: 'URI',
        input: `tuic://${uuid}:synthetic-password@tuic.example.com:443?sni=tuic.example.com&alpn=h3&insecure=1&congestion_control=bbr&udp_relay_mode=native#TUIC-Test`
    },
    {
        format: 'Clash YAML',
        input: yaml.dump({ proxies: [{
            name: proxy.tag,
            type: 'tuic',
            server: proxy.server,
            port: proxy.server_port,
            uuid,
            password: proxy.password,
            sni: proxy.tls.server_name,
            alpn: ['h3'],
            'skip-cert-verify': true,
            'congestion-controller': 'bbr',
            'udp-relay-mode': 'native'
        }] })
    },
    { format: 'Sing-Box JSON', input: JSON.stringify({ outbounds: [proxy] }) }
];

describe('Surge TUIC v5 format', () => {
    it.each(inputs)('emits an explicit v5 policy from $format and preserves it on reimport', async ({ input }) => {
        const builder = new SurgeConfigBuilder(input, [], [], null, 'zh-CN', null, false);

        const profile = await builder.build();

        expect(profile).toContain('TUIC-Test = tuic-v5, tuic.example.com, 443,');
        expect(profile).toContain(`uuid=${uuid}`);
        expect(profile).toContain('password=synthetic-password');
        expect(profile).toContain('sni=tuic.example.com');
        expect(profile).toContain('alpn=h3');
        expect(profile).toContain('skip-cert-verify=true');
        expect(profile).not.toContain('TUIC-Test = tuic,');
        expect(profile).not.toContain('token=');

        const parsed = parseSurgeIni(profile);
        expect(parsed?.proxies).toHaveLength(1);
        expect(parsed.proxies[0]).toMatchObject(proxy);
    });

    it.each(['tuic', 'tuic-v5'])('accepts UUID/password policies labeled %s', (type) => {
        const parsed = convertSurgeProxyToObject(
            `TUIC-Test = ${type}, tuic.example.com, 443, uuid=${uuid}, password=synthetic-password, sni=tuic.example.com, alpn=h3, skip-cert-verify=true, congestion-controller=bbr, udp-relay-mode=native`
        );

        expect(parsed).toMatchObject(proxy);
    });
});
