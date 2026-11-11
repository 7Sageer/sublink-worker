import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

// Shape of the query a 3x-ui share link produced (values anonymized): no `#name`, a `/` before `?`
const QUERY = 'config=vless%3A%2F%2F00000000-0000-4000-8000-000000000001%40203.0.113.10%3A20443%2F%3Fencryption%3Dnone%26fp%3Dchrome%26pbk%3DTESTPUBLICKEY0000000000000000000000000000000%26security%3Dreality%26sid%3D0123456789abcd%26sni%3Dvuejs.org%26spx%3D%252F0spiderx000000%26support-x25519mlkem768%3Dtrue%26type%3Dtcp&ua=&selectedRules=%5B%22Location%3ACN%22%2C%22Private%22%2C%22Non-China%22%2C%22Github%22%2C%22Google%22%2C%22Youtube%22%2C%22AI+Services%22%2C%22Telegram%22%5D&customRules=%5B%5D&include_auto_select=false';

const app = () => createApp({ kv: new MemoryKVAdapter(), assetFetcher: null, logger: console, config: {} });

describe('share links without a #name', () => {
    it('are kept for QuanX with an endpoint-based name', async () => {
        const res = await app().request(`http://localhost/quanx?${QUERY}`);
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('vless=203.0.113.10:20443, method=none, password=00000000-0000-4000-8000-000000000001, obfs=over-tls, tls-host=vuejs.org, reality-base64-pubkey=TESTPUBLICKEY0000000000000000000000000000000, reality-hex-shortid=0123456789abcd, udp-relay=true, tag=vless 203.0.113.10:20443');
        expect(text).toContain('static=🚀 节点选择, vless 203.0.113.10:20443, direct, reject');
    });

    it('are kept for Clash too', async () => {
        const text = await (await app().request(`http://localhost/clash?${QUERY}`)).text();
        expect(text).toContain('name: vless 203.0.113.10:20443');
    });
});
