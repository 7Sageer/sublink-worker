import { describe, expect, it } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { parseVless } from '../src/parsers/protocols/vlessParser.js';
import { parseTrojan } from '../src/parsers/protocols/trojanParser.js';

const vless = (query, name) =>
    `vless://11111111-2222-3333-4444-555555555555@1.2.3.4:443?security=tls&sni=a.com${query}#${name}`;

async function buildOutbounds(lines) {
    const builder = new SingboxConfigBuilder(lines.join('\n'), [], [], null, 'en-US', 'test', false, false, undefined, undefined, '1.14');
    const config = await builder.build();
    return config.outbounds.filter(o => o.server);
}

describe('share-link transport type', () => {
    it.each(['', '&type=tcp', '&type=raw'])('treats %s as plain TCP', (query) => {
        expect(parseVless(vless(`${query}&host=a.com&path=%2Fp`, 'n')).transport).toBeUndefined();
        expect(parseTrojan(`trojan://pw@1.2.3.4:443?sni=a.com${query}&host=a.com#n`).transport).toBeUndefined();
    });
});

// One node sing-box cannot express must not make the whole config fail to load.
describe('sing-box transport normalization', () => {
    it('drops nodes whose transport sing-box does not support', async () => {
        const outbounds = await buildOutbounds([
            vless('&type=xhttp&path=%2Fx', 'XHTTP'),
            vless('&type=kcp', 'KCP'),
            vless('&type=ws&path=%2Fws', 'WS'),
        ]);
        expect(outbounds.map(o => o.tag)).toEqual(['WS']);
    });

    it('maps h2 to http and strips fields the transport does not accept', async () => {
        const outbounds = await buildOutbounds([
            vless('&type=h2&path=%2Fh', 'H2'),
            vless('&type=grpc&serviceName=svc&path=%2Fg', 'GRPC'),
            vless('&type=quic&path=%2Fq', 'QUIC'),
        ]);
        const byTag = Object.fromEntries(outbounds.map(o => [o.tag, o.transport]));
        expect(byTag.H2).toEqual({ type: 'http', path: '/h' });
        expect(byTag.GRPC).toEqual({ type: 'grpc', service_name: 'svc' });
        expect(byTag.QUIC).toEqual({ type: 'quic' });
    });
});
