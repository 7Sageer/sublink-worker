/**
 * Sing-box Configuration
 * Base configuration template for Sing-box client
 */

export const SING_BOX_CONFIG = {
	dns: {
		servers: [
			{
				type: "tcp",
				tag: "dns_proxy",
				server: "1.1.1.1",
				detour: "🚀 节点选择",
				domain_resolver: "dns_resolver"
			},
			{
				type: "https",
				tag: "dns_direct",
				server: "dns.alidns.com",
				domain_resolver: "dns_resolver"
			},
			{
				type: "udp",
				tag: "dns_resolver",
				server: "223.5.5.5"
			},
			{
				type: "fakeip",
				tag: "dns_fakeip",
				inet4_range: "198.18.0.0/15",
				inet6_range: "fc00::/18"
			}
		],
		rules: [
			{
				rule_set: "geolocation-!cn",
				query_type: [
					"A",
					"AAAA"
				],
				server: "dns_fakeip"
			},
			{
				rule_set: "geolocation-!cn",
				query_type: "CNAME",
				server: "dns_proxy"
			},
			{
				query_type: [
					"A",
					"AAAA",
					"CNAME"
				],
				invert: true,
				action: "predefined",
				rcode: "REFUSED"
			}
		],
		final: "dns_direct",
		independent_cache: true
	},
	ntp: {
		enabled: true,
		server: 'time.apple.com',
		server_port: 123,
		interval: '30m'
	},
	inbounds: [
		{ type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 2080 },
		{ type: 'tun', tag: 'tun-in', address: '172.19.0.1/30', auto_route: true, strict_route: true, stack: 'mixed', sniff: true }
	],
	outbounds: [
		{ type: 'block', tag: 'REJECT' },
		{ type: "direct", tag: 'DIRECT' }
	],
	route: {
		default_domain_resolver: "dns_resolver",
		"rule_set": [
			{
				"tag": "geosite-geolocation-!cn",
				"type": "local",
				"format": "binary",
				"path": "geosite-geolocation-!cn.srs"
			}
		],
		rules: []
	},
	experimental: {
		cache_file: {
			enabled: true,
			store_fakeip: true
		}
	}
};
