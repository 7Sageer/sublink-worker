/**
 * Surge Configuration
 * Base configuration template for Surge client
 */

export const SURGE_CONFIG = {
	'general': {
		'allow-wifi-access': false,
		'wifi-access-http-port': 6152,
		'wifi-access-socks5-port': 6153,
		'http-listen': '127.0.0.1:6152',
		'socks5-listen': '127.0.0.1:6153',
		'allow-hotspot-access': false,
		'skip-proxy': '127.0.0.1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,100.64.0.0/10,17.0.0.0/8,localhost,*.local,*.crashlytics.com,seed-sequoia.siri.apple.com,sequoia.apple.com',
		'test-timeout': 5,
		'proxy-test-url': 'http://cp.cloudflare.com/generate_204',
		'internet-test-url': 'http://www.apple.com/library/test/success.html',
		'geoip-maxmind-url': 'https://raw.githubusercontent.com/Loyalsoldier/geoip/release/Country.mmdb',
		'ipv6': false,
		'show-error-page-for-reject': true,
		'dns-server': '119.29.29.29, 180.184.1.1, 223.5.5.5, system',
		'encrypted-dns-server': 'https://223.5.5.5/dns-query',
		'exclude-simple-hostnames': true,
		'read-etc-hosts': true,
		'always-real-ip': '*.msftconnecttest.com, *.msftncsi.com, *.srv.nintendo.net, *.stun.playstation.net, xbox.*.microsoft.com, *.xboxlive.com, *.logon.battlenet.com.cn, *.logon.battle.net, stun.l.google.com, easy-login.10099.com.cn,*-update.xoyocdn.com, *.prod.cloud.netflix.com, appboot.netflix.com, *-appboot.netflix.com',
		'hijack-dns': '*:53',
		'udp-policy-not-supported-behaviour': 'REJECT',
		'hide-vpn-icon': false,
	},
	'replica': {
		'hide-apple-request': true,
		'hide-crashlytics-request': true,
		'use-keyword-filter': false,
		'hide-udp': false
	}
};
