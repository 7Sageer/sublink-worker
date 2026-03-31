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
				detour: "DIRECT"
			}
		],
		rules: [
			{
				outbound: "any",
				server: "localDns"
			},
			{
				rule_set: "cn",
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
				rule_set: "geolocation-!cn",
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
		{
			tag: "tun-in",
			type: "tun",
			address: [
				"172.19.0.0/30"
			],
			mtu: 9000,
			auto_route: true,
			strict_route: true,
			stack: "system",
			platform: {
				http_proxy: {
					enabled: true,
					server: "127.0.0.1",
					server_port: 2080
				}
			}
		},
		{
			tag: "mixed-in",
			type: "mixed",
			listen: "127.0.0.1",
			listen_port: 2080
		}
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
				tag: "proxyDns",
				address: "tls://8.8.8.8",
				detour: "Proxy"
			},
			{
				tag: "localDns",
				address: "https://223.5.5.5/dns-query",
				detour: "DIRECT"
			}
		],
		rules: [
			{
				outbound: "any",
				server: "localDns"
			},
			{
				rule_set: "cn",
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
				rule_set: "geolocation-!cn",
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
		{
			tag: "tun-in",
			type: "tun",
			address: [
				"172.19.0.0/30"
			],
			mtu: 9000,
			auto_route: true,
			strict_route: true,
			stack: "system",
			platform: {
				http_proxy: {
					enabled: true,
					server: "127.0.0.1",
					server_port: 2080
				}
			}
		},
		{
			tag: "mixed-in",
			type: "mixed",
			listen: "127.0.0.1",
			listen_port: 2080
		}
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
