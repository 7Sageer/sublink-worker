import { describe, it, expect } from 'vitest';
import { parseSubscriptionContent } from '../src/parsers/subscription/subscriptionContentParser.js';
import { InvalidPayloadError } from '../src/services/errors.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import yaml from 'js-yaml';

describe('Normalized input object parsing', () => {
    it('parses {version,nodes} and feeds builders', async () => {
        const normalized = {
            version: '1.0.0',
            nodes: [
                {
                    kind: 'vless',
                    tag: 'N1',
                    host: 'example.com',
                    port: 443,
                    uuid: '00000000-0000-0000-0000-000000000000',
                    tls: { enabled: true, sni: 'example.com', insecure: false },
                    udp: true
                }
            ]
        };
        const content = JSON.stringify(normalized);

        const parsed = parseSubscriptionContent(content);
        expect(parsed.type).toBe('normalizedInput');
        expect(parsed.proxies).toHaveLength(1);
        expect(parsed.proxies[0]).toMatchObject({
            type: 'vless',
            tag: 'N1',
            server: 'example.com',
            server_port: 443,
            uuid: '00000000-0000-0000-0000-000000000000',
            udp: true
        });

        const builder = new ClashConfigBuilder(
            content,
            [],
            [],
            null,
            'zh-CN',
            'test-agent'
        );
        const yamlText = await builder.build();
        const config = yaml.load(yamlText);
        expect(Array.isArray(config.proxies)).toBe(true);
        expect(config.proxies.length).toBeGreaterThan(0);
    });

    it('rejects invalid normalized input with actionable errors', () => {
        expect(() => parseSubscriptionContent(JSON.stringify({ version: '', nodes: [] }))).toThrow(InvalidPayloadError);
        expect(() => parseSubscriptionContent(JSON.stringify({ version: '1.0.0', nodes: [{ kind: 'vless' }] }))).toThrow(
            /nodes\[0\]\.host: is required/
        );
    });
});

