import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SING_BOX_CONFIG } from '../src/config/singboxConfig.js';
import yaml from 'js-yaml';

const UUID = '11111111-2222-3333-4444-555555555555';

const wsLink = ({ path, host = 'node.example.com', server = 'node.example.com' }) =>
    `vless://${UUID}@${server}:443?encryption=none&security=tls&sni=${host}&type=ws&host=${host}&path=${encodeURIComponent(path)}#WS`;

const buildSingbox = async (input, { baseConfig = null, version = '1.14', userAgent = 'sing-box/1.14' } = {}) => {
    const builder = new SingboxConfigBuilder(input, [], [], baseConfig, 'en-US', userAgent, false, false, undefined, undefined, version);
    return builder.build();
};

const nodeOutbounds = (config) => config.outbounds.filter(outbound => outbound.server);

const cloneBaseConfig = () => structuredClone(SING_BOX_CONFIG);

describe('Xray WebSocket early data (?ed=)', () => {
    it('moves the ed query into transport fields for sing-box', async () => {
        const config = await buildSingbox(wsLink({ path: '/ws?ed=2652' }));
        const node = nodeOutbounds(config)[0];

        expect(node.transport).toEqual({
            type: 'ws',
            path: '/ws',
            headers: { host: 'node.example.com' },
            max_early_data: 2652,
            early_data_header_name: 'Sec-WebSocket-Protocol'
        });
    });

    it('keeps other path query params and leaves a plain path alone', async () => {
        const withExtra = await buildSingbox(wsLink({ path: '/ws?ed=1024&foo=bar' }));
        expect(nodeOutbounds(withExtra)[0].transport.path).toBe('/ws?foo=bar');

        const plain = await buildSingbox(wsLink({ path: '/ws' }));
        expect(nodeOutbounds(plain)[0].transport).toEqual({
            type: 'ws',
            path: '/ws',
            headers: { host: 'node.example.com' }
        });
    });

    it('ignores a non-numeric or zero ed value', async () => {
        for (const path of ['/ws?ed=abc', '/ws?ed=0', '/ws?ed=']) {
            const config = await buildSingbox(wsLink({ path }));
            const node = nodeOutbounds(config)[0];
            expect(node.transport.path).toBe(path);
            expect(node.transport).not.toHaveProperty('max_early_data');
        }
    });

    it('writes the Clash spelling of early data', async () => {
        const builder = new ClashConfigBuilder(wsLink({ path: '/ws?ed=2652' }), [], [], null, 'en-US', 'mihomo/1.0');
        const config = yaml.load(await builder.build());

        expect(config.proxies[0]['ws-opts']).toEqual({
            path: '/ws',
            headers: { host: 'node.example.com' },
            'max-early-data': 2652,
            'early-data-header-name': 'Sec-WebSocket-Protocol'
        });
    });

    it('writes the Clash spelling of early data for trojan as well', async () => {
        const link = `trojan://pw@node.example.com:443?sni=node.example.com&type=ws&host=node.example.com&path=${encodeURIComponent('/ws?ed=2048')}#T`;
        const builder = new ClashConfigBuilder(link, [], [], null, 'en-US', 'mihomo/1.0');
        const config = yaml.load(await builder.build());

        expect(config.proxies[0]['ws-opts']['max-early-data']).toBe(2048);
        expect(config.proxies[0]['ws-opts'].path).toBe('/ws');
    });

    it('reads mihomo ws-opts early data back into the sing-box transport', async () => {
        const input = `proxies:
  - name: WS-YAML
    type: vless
    server: node.example.com
    port: 443
    uuid: ${UUID}
    tls: true
    servername: node.example.com
    network: ws
    ws-opts:
      path: /ws
      headers:
        Host: node.example.com
      max-early-data: 2048
      early-data-header-name: Sec-WebSocket-Protocol`;
        const config = await buildSingbox(input);
        const node = nodeOutbounds(config)[0];

        expect(node.transport.max_early_data).toBe(2048);
        expect(node.transport.early_data_header_name).toBe('Sec-WebSocket-Protocol');
        expect(node.transport.path).toBe('/ws');
    });
});

describe('node domain_resolver', () => {
    it('stamps a resolver on every domain server but not on IP servers', async () => {
        const config = await buildSingbox([
            wsLink({ path: '/a' }),
            wsLink({ path: '/b', server: '1.2.3.4' })
        ].join('\n'));
        const nodes = nodeOutbounds(config);

        expect(nodes.find(node => node.server === 'node.example.com').domain_resolver).toBe('dns_resolver');
        expect(nodes.find(node => node.server === '1.2.3.4')).not.toHaveProperty('domain_resolver');
    });

    it('keeps an explicit resolver coming from the subscription', async () => {
        const input = JSON.stringify({
            outbounds: [{
                type: 'vless',
                tag: 'explicit',
                server: 'node.example.com',
                server_port: 443,
                uuid: UUID,
                domain_resolver: { server: 'dns_direct', strategy: 'ipv4_only' }
            }]
        });
        const config = await buildSingbox(input);
        const node = nodeOutbounds(config)[0];

        expect(node.domain_resolver).toEqual({ server: 'dns_direct', strategy: 'ipv4_only' });
    });

    it('leaves the 1.11 tier alone, which has no dial fields', async () => {
        const config = await buildSingbox(wsLink({ path: '/a' }), { version: '1.11', userAgent: 'sing-box/1.11' });
        expect(nodeOutbounds(config)[0]).not.toHaveProperty('domain_resolver');
    });

    it('prefers the remote resolver once it is reachable without the proxy', async () => {
        const baseConfig = cloneBaseConfig();
        delete baseConfig.route.default_domain_resolver;
        // The builder pins dns.servers[0] behind the node selector, so keep the
        // remote resolver off that slot and point its detour at DIRECT.
        const others = baseConfig.dns.servers.filter(server => server.tag !== 'dns_proxy');
        baseConfig.dns.servers = [...others, { type: 'udp', tag: 'dns_proxy', server: '8.8.8.8', detour: 'DIRECT' }];
        const config = await buildSingbox(wsLink({ path: '/a' }), { baseConfig });

        expect(nodeOutbounds(config)[0].domain_resolver).toBe('dns_proxy');
        expect(config.route.default_domain_resolver).toBe('dns_proxy');
    });

    it('never resolves a node through a DNS server that detours into the proxy', async () => {
        const config = await buildSingbox(wsLink({ path: '/a' }));

        // dns_proxy detours through 节点选择, so it cannot bootstrap itself.
        expect(nodeOutbounds(config)[0].domain_resolver).toBe('dns_resolver');
    });

    it('uses a template dns-remote tag even when it is listed first', async () => {
        const baseConfig = cloneBaseConfig();
        delete baseConfig.route.default_domain_resolver;
        baseConfig.dns.servers = [
            { type: 'https', tag: 'dns-remote', server: '1.1.1.1', domain_resolver: 'dns-local' },
            { type: 'udp', tag: 'dns-local', server: '223.5.5.5' },
            { type: 'fakeip', tag: 'dns_fakeip', inet4_range: '198.18.0.0/15' }
        ];
        const config = await buildSingbox(wsLink({ path: '/a' }), { baseConfig });

        expect(nodeOutbounds(config)[0].domain_resolver).toBe('dns-remote');
        expect(config.dns.servers.find(server => server.tag === 'dns-remote').detour).toBeUndefined();
    });

    it('keeps a template DNS server that was declared direct', async () => {
        const baseConfig = cloneBaseConfig();
        baseConfig.dns.servers = baseConfig.dns.servers.map(server =>
            server.tag === 'dns_proxy' ? { ...server, detour: undefined } : server
        );
        const config = await buildSingbox(wsLink({ path: '/a' }), { baseConfig });

        // The old constructor forced dns.servers[0] behind the node selector.
        expect(config.dns.servers[0].detour).toBeUndefined();
    });
});
