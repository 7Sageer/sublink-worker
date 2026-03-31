/**
 * Sing-box Configuration
 * Base configuration template for Sing-box client
 */

export const SING_BOX_CONFIG = {
	dns: {
		servers: [
			{
				tag: "dns_proxy",
				address: "tls://8.8.8.8",
				detour: "🚀 节点选择"
			},
			{
				tag: "dns_direct",
				address: "https://dns.alidns.com/dns-query",
				detour: "DIRECT"
			}
		],
		rules: [
			{
				outbound: "any",
				server: "dns_direct"
			},
			{
				rule_set: "cn",
				server: "dns_direct"
			},
			{
				clash_mode: "direct",
				server: "dns_direct"
			},
			{
				clash_mode: "global",
				server: "dns_proxy"
			},
			{
				rule_set: "geolocation-!cn",
				server: "dns_proxy"
			}
		],
		final: "dns_direct"
	},
	ntp: {
		enabled: true,
		server: 'time.apple.com',
		server_port: 123,
		interval: '30m'
	},
	inbounds: [
		{ type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 2080 },
		{ type: 'tun', tag: 'tun-in', address: '172.19.0.1/30', auto_route: true, strict_route: true, stack: 'mixed' }
	],
	outbounds: [
		{ type: 'block', tag: 'REJECT' },
		{ type: "direct", tag: 'DIRECT' }
	],
	route: {
		"rule_set": [
			{
				"tag": "geolocation-!cn",
				"type": "local",
				"format": "binary",
				"path": "geolocation-!cn.srs"
			}
		],
		rules: []
	},
	experimental: {
		cache_file: {
			enabled: true
		}
	}
};

export const SING_BOX_CONFIG_V1_11 = {
	dns: {
		servers: [
			{
				tag: "dns_proxy",
				address: "tls://8.8.8.8",
				detour: "🚀 节点选择"
			},
			{
				tag: "dns_direct",
				address: "https://dns.alidns.com/dns-query",
				detour: "DIRECT"
			}
		],
		rules: [
			{
				outbound: "any",
				server: "dns_direct"
			},
			{
				rule_set: "cn",
				server: "dns_direct"
			},
			{
				clash_mode: "direct",
				server: "dns_direct"
			},
			{
				clash_mode: "global",
				server: "dns_proxy"
			},
			{
				rule_set: "geolocation-!cn",
				server: "dns_proxy"
			}
		],
		final: "dns_direct"
	},
	ntp: {
		enabled: true,
		server: 'time.apple.com',
		server_port: 123,
		interval: '30m'
	},
	inbounds: [
		{ type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 2080 },
		{ type: 'tun', tag: 'tun-in', address: '172.19.0.1/30', auto_route: true, strict_route: true, stack: 'mixed' }
	],
	outbounds: [
		{ type: 'block', tag: 'REJECT' },
		{ type: "direct", tag: 'DIRECT' }
	],
	route: {
		"rule_set": [],
		rules: []
	},
	experimental: {
		cache_file: {
			enabled: true
		}
	}
};
