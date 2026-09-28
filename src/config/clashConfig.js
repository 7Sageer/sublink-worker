/**
 * Clash Configuration
 * Base configuration template for Clash client
 */

export const CLASH_DOMESTIC_DNS_SERVERS = Object.freeze([
	'https://120.53.53.53/dns-query',
	'https://223.5.5.5/dns-query'
]);

export const CLASH_FOREIGN_DNS_SERVERS = Object.freeze([
	'https://1.1.1.1/dns-query#RULES',
	'https://8.8.8.8/dns-query#RULES'
]);

export const CLASH_DEFAULT_NAMESERVERS = Object.freeze([
	'223.5.5.5',
	'119.29.29.29'
]);

const MANAGED_NAMESERVER_POLICY_KEYS = new Set([
	'geosite:cn',
	'geosite:private',
	'geosite:cn,private',
	'geosite:private,cn',
	'geosite:geolocation-!cn',
	'rule-set:cn',
	'rule-set:geolocation-cn',
	'rule-set:geolocation-!cn'
]);

function isManagedNameserverPolicyKey(key) {
	return typeof key === 'string'
		&& MANAGED_NAMESERVER_POLICY_KEYS.has(key.toLowerCase().replace(/\s+/g, ''));
}

export function normalizeClashDnsConfig(dnsConfig, ruleProviders = {}) {
	const dns = dnsConfig && typeof dnsConfig === 'object' && !Array.isArray(dnsConfig)
		? { ...dnsConfig }
		: {};
	const incomingPolicy = dns['nameserver-policy'];
	const nameserverPolicy = incomingPolicy && typeof incomingPolicy === 'object' && !Array.isArray(incomingPolicy)
		? Object.fromEntries(
			Object.entries(incomingPolicy).filter(([key]) => !isManagedNameserverPolicyKey(key))
		)
		: {};

	nameserverPolicy['geosite:private,cn'] = [...CLASH_DOMESTIC_DNS_SERVERS];
	if (Object.hasOwn(ruleProviders, 'cn')) {
		nameserverPolicy['rule-set:cn'] = [...CLASH_DOMESTIC_DNS_SERVERS];
	}
	if (Object.hasOwn(ruleProviders, 'geolocation-cn')) {
		nameserverPolicy['rule-set:geolocation-cn'] = [...CLASH_DOMESTIC_DNS_SERVERS];
	}

	dns.enable = true;
	dns['respect-rules'] = false;
	dns['default-nameserver'] = [...CLASH_DEFAULT_NAMESERVERS];
	dns.nameserver = [...CLASH_FOREIGN_DNS_SERVERS];
	dns['proxy-server-nameserver'] = [...CLASH_DOMESTIC_DNS_SERVERS];
	dns['direct-nameserver'] = [...CLASH_DOMESTIC_DNS_SERVERS];
	dns['direct-nameserver-follow-policy'] = false;
	dns['nameserver-policy'] = nameserverPolicy;

	delete dns.fallback;
	delete dns['fallback-filter'];
	delete dns['fallback-lazy-query'];
	delete dns['proxy-server-nameserver-policy'];

	return dns;
}

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
		'respect-rules': false,
		'enhanced-mode': 'fake-ip',
		'default-nameserver': [...CLASH_DEFAULT_NAMESERVERS],
		'nameserver': [...CLASH_FOREIGN_DNS_SERVERS],
		'proxy-server-nameserver': [...CLASH_DOMESTIC_DNS_SERVERS],
		'direct-nameserver': [...CLASH_DOMESTIC_DNS_SERVERS],
		'direct-nameserver-follow-policy': false,
		'nameserver-policy': {
			'geosite:private,cn': [...CLASH_DOMESTIC_DNS_SERVERS]
		}
	},
	'proxies': [],
	'proxy-groups': []
};
