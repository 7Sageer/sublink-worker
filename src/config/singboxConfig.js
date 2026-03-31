/**
 * Sing-box Configuration
 * Base configuration template for Sing-box client
 */

export const SING_BOX_CONFIG = {
	dns: {
		servers: [
			{
				tag: "proxyDns",
				address: "tls://8.8.8.8",
				detour: "Proxy"
			},
			{
				tag: "localDns",
				address: "https://223.5.5.5/dns-query",
				detour: "direct"
			}
		],
		rules: [
			{
				outbound: "any",
				server: "localDns"
			},
			{
				rule_set: "geosite-cn",
				server: "localDns"
			},
			{
				clash_mode: "direct",
				server: "localDns"
			},
			{
				clash_mode: "global",
				server: "proxyDns"
			},
			{
				rule_set: "geosite-geolocation-!cn",
				server: "proxyDns"
			}
		],
		final: "localDns",
		strategy: "ipv4_only"
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
			enabled: true
		}
	}
};

export const SING_BOX_CONFIG_V1_11 = {
	dns: {
		servers: [
			{
				tag: "proxyDns",
				address: "tls://8.8.8.8",
				detour: "Proxy"
			},
			{
				tag: "localDns",
				address: "https://223.5.5.5/dns-query",
				detour: "direct"
			}
		],
		rules: [
			{
				outbound: "any",
				server: "localDns"
			},
			{
				rule_set: "geosite-cn",
				server: "localDns"
			},
			{
				clash_mode: "direct",
				server: "localDns"
			},
			{
				clash_mode: "global",
				server: "proxyDns"
			},
			{
				rule_set: "geosite-geolocation-!cn",
				server: "proxyDns"
			}
		],
		final: "localDns",
		strategy: "ipv4_only"
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
