/**
 * Clash Configuration
 * Base configuration template for Clash client
 */

export const CLASH_CONFIG = {
	'port': 7890,
	'socks-port': 7891,
	'allow-lan': false,
	'mode': 'rule',
	'log-level': 'info',
	'geodata-mode': true,
	'geo-auto-update': true,
	'geodata-loader': 'standard',
	'geo-update-interval': 24,
	'geox-url': {
		'geoip': "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
		'geosite': "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
		'mmdb': "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb",
		'asn': "https://github.com/xishang0128/geoip/releases/download/latest/GeoLite2-ASN.mmdb"
	},
	'rule-providers': {
		// 将由代码自动生成
	},
	'dns': {
		'enable': true,
		'ipv6': true,
		'respect-rules': true,
		'enhanced-mode': 'fake-ip',
		'nameserver': [
			'https://120.53.53.53/dns-query',
			'https://223.5.5.5/dns-query'
		],
		'proxy-server-nameserver': [
			'https://120.53.53.53/dns-query',
			'https://223.5.5.5/dns-query'
		],
		'nameserver-policy': {
			'geosite:cn,private': [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			'geosite:geolocation-!cn': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query'
			]
		}
	},
	'proxies': [],
	'proxy-groups': []
};
