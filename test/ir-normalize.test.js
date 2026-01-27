import { describe, it, expect } from 'vitest';
import { normalizeLegacyProxyToIR, convertIRToLegacyProxy, downgradeByCaps } from '../src/ir/index.js';

describe('IR normalization (A plan)', () => {
    it('normalizes vless proxy into IR and back', () => {
        const legacy = {
            tag: 'N1',
            type: 'vless',
            server: 'example.com',
            server_port: 443,
            uuid: '00000000-0000-0000-0000-000000000000',
            udp: true,
            tls: { enabled: true, server_name: 'example.com', insecure: false }
        };

        const ir = normalizeLegacyProxyToIR(legacy, { strict: true });
        expect(ir).toMatchObject({
            kind: 'vless',
            host: 'example.com',
            port: 443,
            tags: ['N1']
        });

        const roundtrip = convertIRToLegacyProxy(ir);
        expect(roundtrip).toMatchObject({
            tag: 'N1',
            type: 'vless',
            server: 'example.com',
            server_port: 443,
            uuid: '00000000-0000-0000-0000-000000000000',
            udp: true
        });
    });

    it('applies capability downgrade for clash', () => {
        const ir = {
            version: '1.0.0',
            kind: 'vless',
            host: 'example.com',
            port: 443,
            tags: ['N1'],
            auth: { uuid: '00000000-0000-0000-0000-000000000000' },
            tls: {
                enabled: true,
                sni: 'example.com',
                reality: { enabled: true, public_key: 'k', short_id: 's' },
                utls: { enabled: true, fingerprint: 'chrome' }
            }
        };

        const downgraded = downgradeByCaps(ir, 'clash');
        expect(downgraded.tls.reality).toBeUndefined();
        expect(downgraded.tls.utls).toBeUndefined();
    });
});

