// Base URL for remote rule sets
const RULE_SET_BASE_URL = 'https://github.com/lyc8503/sing-box-rules/raw/';

// Rule set definitions
const SITE_RULE_SETS = {
	'category-ads-all': 'rule-set-geosite/geosite-adblockplus.srs',
	google: 'rule-set-geosite/geosite-google.srs',
	netflix: 'rule-set-geosite/geosite-netflix.srs',
	youtube: 'rule-set-geosite/geosite-youtube.srs',
	bilibili: 'rule-set-geosite/geosite-bilibili.srs',
	openai: 'rule-set-geosite/geosite-openai.srs',
	cn: 'rule-set-geosite/geosite-cn.srs',
	'geolocation-cn': 'rule-set-geosite/geosite-geolocation-cn.srs',
	'geolocation-!cn': 'rule-set-geosite/geosite-geolocation-!cn.srs'
};

const IP_RULE_SETS = { 
	'netflix': 'rule-set-geoip/geoip-netflix.srs',
	'telegram': 'rule-set-geoip/geoip-telegram.srs',
};

// Unified selectors list
export const SELECTORS_LIST = ['🚀 节点选择', '🛑 广告拦截', '🌍 国外媒体', '🔒 私有网络', '🇨🇳 国内服务', '📲 电报消息', '💬 OpenAI', '📹 油管视频', '🎥 奈飞视频', '📺 哔哩哔哩', '🇬 谷歌服务', '🐟 漏网之鱼', 'GLOBAL'];

// Unified rules for both Singbox and Clash
const SITE_UNIFIED_RULES = [
	{ rule_set: ['category-ads-all'], outbound: '🛑 广告拦截' },
	{ rule_set: ['openai'], outbound: '💬 OpenAI' },
	{ rule_set: ['bilibili'], outbound: '📺 哔哩哔哩' },
	{ rule_set: ['youtube'], outbound: '📹 油管视频' },
	{ rule_set: ['google'], outbound: '🇬 谷歌服务' },
	{ rule_set: ['netflix'], outbound: '🎥 奈飞视频' },
	{ rule_set: ['geolocation-!cn'], outbound: '🌍 国外媒体' },
	{ ip_is_private: true, outbound: '🔒 私有网络' },
	{ rule_set: ['geolocation-cn'], outbound: '🇨🇳 国内服务' }
];

const IP_UNIFIED_RULES = [
	{ rule_set: ['netflix-ip'], outbound: '🎥 奈飞视频' },
	{ rule_set: ['telegram-ip'], outbound: '📲 电报消息' },
];

// Singbox configuration
export const SING_BOX_CONFIG = {
	log: {
		disabled: false,
		level: 'info',
		timestamp: true,
	},
	dns: {
		servers: [
			{ tag: 'dns_proxy', address: 'tls://1.1.1.1', address_resolver: 'dns_resolver' },
			{ tag: 'dns_direct', address: 'h3://dns.alidns.com/dns-query', address_resolver: 'dns_resolver', detour: 'DIRECT' },
			{ tag: 'dns_fakeip', address: 'fakeip' },
			{ tag: 'dns_resolver', address: '223.5.5.5', detour: 'DIRECT' },
			{ tag: 'block', address: 'rcode://success' }
		],
		rules: [
			{ outbound: ['any'], server: 'dns_resolver' },
			{ geosite: ['category-ads-all'], server: 'dns_block', disable_cache: true },
			{ geosite: ['geolocation-!cn'], query_type: ['A', 'AAAA'], server: 'dns_fakeip' },
			{ geosite: ['geolocation-!cn'], server: 'dns_proxy' }
		],
		final: 'dns_direct',
		independent_cache: true,
		fakeip: {
			enabled: true,
			inet4_range: '198.18.0.0/15'
		}
	},
	ntp: {
		enabled: true,
		server: 'time.apple.com',
		server_port: 123,
		interval: '30m',
		detour: 'DIRECT'
	},
	inbounds: [
		{ type: 'mixed', tag: 'mixed-in', listen: '0.0.0.0', listen_port: 2080 },
		{ type: 'tun', tag: 'tun-in', inet4_address: '172.19.0.1/30', auto_route: true, strict_route: true, stack: 'mixed', sniff: true }
	],
	outbounds: [
		{ type: 'direct', tag: 'DIRECT' },
		{ type: 'block', tag: 'REJECT' },
		{ type: 'dns', tag: 'dns-out' }
	],
	route : {
		rules: [
		  { protocol: 'dns', port: 53, outbound: 'dns-out' },
		  { clash_mode: 'direct', outbound: 'DIRECT' },
		  { clash_mode: 'global', outbound: 'GLOBAL' },
		  ...SITE_UNIFIED_RULES,
		  ...IP_UNIFIED_RULES
		],
		auto_detect_interface: true,
		final: '🐟 漏网之鱼',
		rule_set: [
		  ...Object.entries(SITE_RULE_SETS).map(([tag, filename]) => ({
			tag,
			type: 'remote',
			format: 'binary',
			url: `${RULE_SET_BASE_URL}${filename}`,
			download_detour: '⚡ 自动选择'
		  })),
		  ...Object.entries(IP_RULE_SETS).map(([tag, filename]) => ({
			tag: `${tag}-ip`, 
			type: 'remote',
			format: 'binary',
			url: `${RULE_SET_BASE_URL}${filename}`,
			download_detour: '⚡ 自动选择'
		  }))
		]
	},
	experimental: {
		cache_file: {
			enabled: true,
			store_fakeip: true
		},
		clash_api: {
			external_controller: '127.0.0.1:9090',
			external_ui: 'dashboard'
		}
	}
};

// Clash configuration
const CLASH_RULES = [
	...SITE_UNIFIED_RULES.map(rule => {
	  if (rule.rule_set) {
		return `GEOSITE,${rule.rule_set.join('|')},${rule.outbound}`;
	  } else if (rule.ip_is_private) {
		return `IP-CIDR,192.168.0.0/16,${rule.outbound},no-resolve`;
	  }
	}),
	...IP_UNIFIED_RULES.map(rule => {
	  return `GEOIP,${rule.rule_set.join('|').replace('-ip', '')},${rule.outbound}`;
	})
  ].filter(Boolean);

CLASH_RULES.push('MATCH,🐟 漏网之鱼');

export const CLASH_CONFIG = {
	port: 7890,
	'socks-port': 7891,
	'allow-lan': false,
	mode: 'Rule',
	'log-level': 'info',
	dns: {
		enable: true,
		nameserver: ['119.29.29.29', '223.5.5.5'],
		fallback: ['8.8.8.8', '8.8.4.4', 'tls://1.0.0.1:853', 'tls://dns.google:853'],
	},
	proxies: [],
	'proxy-groups': [],
	rules: [...CLASH_RULES],
// will be implemented in the future
//
// 'rule-providers': Object.fromEntries(
// Object.entries(RULE_SETS).map(([name, filename]) => [
// name,
// {
// type: 'http',
// behavior: 'domain',
// url: `${RULE_SET_BASE_URL}${filename}`,
// path: `./ruleset/${name}.yaml`,
// interval: 86400
// }
// ])
// )
};

// Function to get user-defined rules (placeholder for future implementation)
export function getUserDefinedRules() {
	// This function can be implemented in the future to allow users to define their own rules
	return [];
}

// Function to merge user-defined rules with default rules
export function mergeRules(defaultRules, userRules) {
	// This function can be implemented to merge user-defined rules with the default rules
	return [...userRules, ...defaultRules];
}
