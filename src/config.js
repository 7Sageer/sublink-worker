export const SITE_RULE_SET_BASE_URL = 'https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/';
export const IP_RULE_SET_BASE_URL = 'https://github.com/lyc8503/sing-box-rules/raw/rule-set-geoip/';

// Unified rule structure
export const UNIFIED_RULES = [
	{
		name: '广告拦截',
		outbound: '🛑 广告拦截',
		site_rules: ['category-ads-all'],
		ip_rules: ['ad']
	},
	{
		name: 'OpenAI',
		outbound: '💬 OpenAI',
		site_rules: ['openai'],
		ip_rules: []
	},
	{
		name: '哔哩哔哩',
		outbound: '📺 哔哩哔哩',
		site_rules: ['bilibili'],
		ip_rules: []
	},
	{
		name: '油管视频',
		outbound: '📹 油管视频',
		site_rules: ['youtube'],
		ip_rules: []
	},
	{
		name: '谷歌服务',
		outbound: '🇬 谷歌服务',
		site_rules: ['google'],
		ip_rules: ['google']
	},
	{
		name: '奈飞视频',
		outbound: '🎥 奈飞视频',
		site_rules: ['netflix'],
		ip_rules: ['netflix']
	},

	{
		name: '私有网络',
		outbound: '🔒 私有网络',
		site_rules: [],
		ip_rules: ['private']
	},
	{
		name: '国内服务',
		outbound: '🇨🇳 国内服务',
		site_rules: ['geolocation-cn'],
		ip_rules: ['cn']
	},
	{
		name: '电报消息',
		outbound: '📲 电报消息',
		site_rules: [],
		ip_rules: ['telegram']
	},
	{
		name: '微软服务',
		outbound: '🇺 微软服务',
		site_rules: ['microsoft'],
		ip_rules: []
	},
	{
		name: '苹果服务',
		outbound: '🍏 苹果服务',
		site_rules: ['apple'],
		ip_rules: []
	},
	{
		name: '巴哈姆特',
		outbound: '🎮 巴哈姆特',
		site_rules: ['bahamut'],
		ip_rules: []
	},

];

// Generate SITE_RULE_SETS and IP_RULE_SETS from UNIFIED_RULES
export const SITE_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.site_rules.forEach(site_rule => {
		acc[site_rule] = `geosite-${site_rule}.srs`;
	});
	return acc;
}, {});

export const IP_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.ip_rules.forEach(ip_rule => {
		acc[ip_rule] = `geoip-${ip_rule}.srs`;
	});
	return acc;
}, {});

// Helper function to get outbounds based on selected rule names
export function getOutbounds(selectedRuleNames) {
    if (!selectedRuleNames || !Array.isArray(selectedRuleNames)) {
        return []; // or handle this case as appropriate for your use case
    }
    return UNIFIED_RULES
      .filter(rule => selectedRuleNames.includes(rule.name))
      .map(rule => rule.outbound);
}

// Helper function to generate rules based on selected rule names
export function generateRules(selectedRuleNames = []) {
	// If selectedRuleNames is null or undefined, use an empty array
	const safeSelectedRuleNames = selectedRuleNames || [];

	return UNIFIED_RULES
		.filter(rule => safeSelectedRuleNames.includes(rule.name))
		.map(rule => ({
		site_rules: rule.site_rules,
		ip_rules: rule.ip_rules,
		outbound: rule.outbound
			}));
		}

// Helper function to generate rule sets based on selected rule names
export function generateRuleSets(selectedRuleNames = []) {
	// If selectedRuleNames is null or undefined, use an empty array
	const safeSelectedRuleNames = selectedRuleNames || [];

	const selectedRules = UNIFIED_RULES.filter(rule => safeSelectedRuleNames.includes(rule.name));

	const siteRuleSets = selectedRules.flatMap(rule => rule.site_rules);
	const ipRuleSets = selectedRules.flatMap(rule => rule.ip_rules);

	return {
		site_rule_sets: siteRuleSets.map(rule => ({
		tag: rule,
		type: 'remote',
		format: 'binary',
		url: `${SITE_RULE_SET_BASE_URL}${SITE_RULE_SETS[rule]}`,
		download_detour: '⚡ 自动选择'
			})),
			ip_rule_sets: ipRuleSets.map(rule => ({
		tag: `${rule}-ip`,
		type: 'remote',
		format: 'binary',
		url: `${IP_RULE_SET_BASE_URL}${IP_RULE_SETS[rule]}`,
		download_detour: '⚡ 自动选择'
			}))
	};
		}

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
		],
		auto_detect_interface: true,
		final: '🐟 漏网之鱼',
		rule_set: [
			...Object.entries(SITE_RULE_SETS).map(([tag, filename]) => ({
			tag,
			type: 'remote',
			format: 'binary',
			url: `${SITE_RULE_SET_BASE_URL}${filename}`,
			download_detour: '⚡ 自动选择'
				})),
				...Object.entries(IP_RULE_SETS).map(([tag, filename]) => ({
			tag: `${tag}-ip`, 
			type: 'remote',
			format: 'binary',
			url: `${IP_RULE_SET_BASE_URL}${filename}`,
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
};