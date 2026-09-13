import { describe, expect, it } from 'vitest';
import { addProxyWithDedup } from '../src/builders/helpers/proxyHelpers.js';

describe('addProxyWithDedup', () => {
    it('renames exact duplicates without treating substrings as duplicates', () => {
        const proxies = [];

        addProxyWithDedup(proxies, { name: 'edge-hy2', server: 'hy2.example' });
        addProxyWithDedup(proxies, { name: 'edge', server: 'reality.example' });
        addProxyWithDedup(proxies, { name: 'edge', server: 'ws-1.example' });
        addProxyWithDedup(proxies, { name: 'edge', server: 'ws-2.example' });

        expect(proxies.map(proxy => proxy.name)).toEqual([
            'edge-hy2',
            'edge',
            'edge 2',
            'edge 3'
        ]);
    });
});
