export const SITE_RULE_SET_BASE_URL = 'https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/';
export const IP_RULE_SET_BASE_URL = 'https://github.com/lyc8503/sing-box-rules/raw/rule-set-geoip/';
// Custom rules
export const CUSTOM_RULES = [];
// Unified rule structure
export const UNIFIED_RULES = [
	{
		name: 'Ad Block',
		outbound: '🛑 广告拦截',
		site_rules: ['category-ads-all'],
		ip_rules: []
	},
	{
		name: 'AI Services',
		outbound: '💬 AI 服务',
		site_rules: ['openai', 'anthropic','jetbrains-ai','perplexity'],
		ip_rules: []
	},
	{
		name: 'Bilibili',
		outbound: '📺 哔哩哔哩',
		site_rules: ['bilibili'],
		ip_rules: []
	},
	{
		name: 'Youtube',
		outbound: '📹 油管视频',
		site_rules: ['youtube'],
		ip_rules: []
	},
	{
		name: 'Google',
		outbound: '🔍 谷歌服务',
		site_rules: ['google'],
		ip_rules: ['google']
	},

	{
		name: 'Private',
		outbound: '🏠 私有网络',
		site_rules: [],
		ip_rules: ['private']
	},
	{
		name: 'Location:CN',
		outbound: '🔒 国内服务',
		site_rules: ['geolocation-cn'],
		ip_rules: ['cn']
	},
	{
		name: 'Telegram',
		outbound: '📲 电报消息',
		site_rules: [],
		ip_rules: ['telegram']
	},
	{
		name: 'Github',
		outbound: '🐱 Github',
		site_rules: ['github', 'gitlab'],
		ip_rules: []
	},
	{
		name: 'Microsoft',
		outbound: 'Ⓜ️ 微软服务',
		site_rules: ['microsoft'],
		ip_rules: []
	},
	{
		name: 'Apple',
		outbound: '🍏 苹果服务',
		site_rules: ['apple'],
		ip_rules: []
	},
	{
		name: 'Social Media',
		outbound: '🌐 社交媒体',
		site_rules: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin'],
		ip_rules: []
	  },
	  {
		name: 'Streaming',
		outbound: '🎬 流媒体',
		site_rules: ['netflix', 'hulu', 'disney', 'hbo', 'amazon','bahamut'],
		ip_rules: []
	  },
	  {
		name: 'Gaming',
		outbound: '🎮 游戏平台',
		site_rules: ['steam', 'epicgames', 'ea', 'ubisoft', 'blizzard'],
		ip_rules: []
	  },
	  {
		name: 'Education',
		outbound: '📚 教育资源',
		site_rules: ['coursera', 'edx', 'udemy', 'khanacademy', 'category-scholar-!cn'],
		ip_rules: []
	  },
	  {
		name: 'Financial',
		outbound: '💰 金融服务',
		site_rules: ['paypal', 'visa', 'mastercard','stripe','wise'],
		ip_rules: []
	  },
	  {
		name: 'Cloud Services',
		outbound: '☁️ 云服务',
		site_rules: ['aws', 'azure', 'digitalocean', 'heroku', 'dropbox'],
		ip_rules: []
	  },
	  {
		name: 'Non-China',
		outbound: '🌐 非中国',
		site_rules: ['geolocation-!cn'],
		ip_rules: []
	  }

];

export const PREDEFINED_RULE_SETS = {
	minimal: ['Location:CN', 'Private', 'Non-China'],
	balanced: ['Location:CN', 'Private', 'Non-China', 'Google', 'Youtube', 'AI Services', 'Telegram'],
	comprehensive: UNIFIED_RULES.map(rule => rule.name)
  };
  


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
export function generateRules(selectedRules = [], customRules = [], pin) {
	if (typeof selectedRules === 'string' && PREDEFINED_RULE_SETS[selectedRules]) {
	  selectedRules = PREDEFINED_RULE_SETS[selectedRules];
	}
  
	if (!selectedRules || selectedRules.length === 0) {
	  selectedRules = PREDEFINED_RULE_SETS.minimal;
	}
  
	const rules = [];
  
	UNIFIED_RULES.forEach(rule => {
	  if (selectedRules.includes(rule.name)) {
		rules.push({
		  site_rules: rule.site_rules,
		  ip_rules: rule.ip_rules,
		  domain_suffix: rule?.domain_suffix,
		  ip_cidr: rule?.ip_cidr,
		  outbound: rule.outbound
		});
	  }
	});
  
	if (customRules && customRules.length > 0 && pin !== "true") {
		customRules.forEach((rule) => {
		  rules.push({
			site_rules: rule.site.split(','),
			ip_rules: rule.ip.split(','),
			domain_suffix: rule.domain_suffix ? rule.domain_suffix.split(',') : [],
			domain_keyword: rule.domain_keyword ? rule.domain_keyword.split(',') : [],
			ip_cidr: rule.ip_cidr ? rule.ip_cidr.split(',') : [],
			outbound: rule.name
		  });
		});
	}
	else if (customRules && customRules.length > 0 && pin === "true") {
		customRules.reverse();
		customRules.forEach((rule) => {
			rules.unshift({
			  site_rules: rule.site.split(','),
			  ip_rules: rule.ip.split(','),
			  domain_suffix: rule.domain_suffix ? rule.domain_suffix.split(',') : [],
			  domain_keyword: rule.domain_keyword ? rule.domain_keyword.split(',') : [],
			  ip_cidr: rule.ip_cidr ? rule.ip_cidr.split(',') : [],
			  outbound: rule.name
			});
		  });
	}
  
	return rules;
  }


export function generateRuleSets(selectedRules = [], customRules = []) {
  if (typeof selectedRules === 'string' && PREDEFINED_RULE_SETS[selectedRules]) {
    selectedRules = PREDEFINED_RULE_SETS[selectedRules];
  }
  
  if (!selectedRules || selectedRules.length === 0) {
    selectedRules = PREDEFINED_RULE_SETS.minimal;
  }

  const selectedRulesSet = new Set(selectedRules);

  const siteRuleSets = new Set();
  const ipRuleSets = new Set();

  const ruleSets = [];

  UNIFIED_RULES.forEach(rule => {
    if (selectedRulesSet.has(rule.name)) {
      rule.site_rules.forEach(siteRule => siteRuleSets.add(siteRule));
      rule.ip_rules.forEach(ipRule => ipRuleSets.add(ipRule));
    }
  });
  


  const site_rule_sets = Array.from(siteRuleSets).map(rule => ({
    tag: rule,
    type: 'remote',
    format: 'binary',
    url: `${SITE_RULE_SET_BASE_URL}${SITE_RULE_SETS[rule]}`,
    download_detour: '⚡ 自动选择'
  }));

  const ip_rule_sets = Array.from(ipRuleSets).map(rule => ({
    tag: `${rule}-ip`,
    type: 'remote',
    format: 'binary',
    url: `${IP_RULE_SET_BASE_URL}${IP_RULE_SETS[rule]}`,
    	download_detour: '⚡ 自动选择'
  }));

  if(!selectedRules.includes('Non-China')){
	site_rule_sets.push({
		tag: 'geolocation-!cn',
		type: 'remote',
		format: 'binary',
		url: `${SITE_RULE_SET_BASE_URL}geosite-geolocation-!cn.srs`,
		download_detour: '⚡ 自动选择'
	});
  }

  if(customRules){
	customRules.forEach(rule => {
		if(rule.site!=''){
			rule.site.split(',').forEach(site => {
				site_rule_sets.push({
					tag: site.trim(),
					type: 'remote',
					format: 'binary',
					url: `${SITE_RULE_SET_BASE_URL}geosite-${site.trim()}.srs`,
					download_detour: '⚡ 自动选择'
				});
			});
		}
		if(rule.ip!=''){
			rule.ip.split(',').forEach(ip => {
				ip_rule_sets.push({
					tag: `${ip.trim()}-ip`,
					type: 'remote',
					format: 'binary',
					url: `${IP_RULE_SET_BASE_URL}geoip-${ip.trim()}.srs`,
					download_detour: '⚡ 自动选择'
				});
			});
		}
	});
	}

  ruleSets.push(...site_rule_sets, ...ip_rule_sets);

  return { site_rule_sets, ip_rule_sets };
}

// Singbox configuration
export const SING_BOX_CONFIG = {
	dns: {
		servers: [
			{
				tag: "dns_proxy",
				address: "tcp://1.1.1.1",
				address_resolver: "dns_resolver",
				strategy: "ipv4_only",
				detour: "🚀 节点选择"
			},
			{
				tag: "dns_direct", 
				address: "https://dns.alidns.com/dns-query",
				address_resolver: "dns_resolver",
				strategy: "ipv4_only",
				detour: "DIRECT"
			},
			{
				tag: "dns_resolver",
				address: "223.5.5.5",
				detour: "DIRECT"
			},
			{
				tag: "dns_success",
				address: "rcode://success"
			},
			{
				tag: "dns_refused",
				address: "rcode://refused"
			},
			{
				tag: "dns_fakeip",
				address: "fakeip"
			}
		],
		rules: [
			{
				outbound: "any",
				server: "dns_resolver"
			},
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
				query_type: [
					"CNAME"
				],
				server: "dns_proxy"
			},
			{
				query_type: [
					"A",
					"AAAA",
					"CNAME"
				],
				invert: true,
				server: "dns_refused",
				disable_cache: true
			}
		],
		final: "dns_direct",
		independent_cache: true,
		fakeip: {
			enabled: true,
			inet4_range: "198.18.0.0/15",
			inet6_range: "fc00::/18"
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
		"rule_set": [
            {
                "tag": "geosite-geolocation-!cn",
                "type": "local",
                "format": "binary",
                "path": "geosite-geolocation-!cn.srs"
            }
		],
		rules: [
			{
				"outbound": "any",
				"server": "dns_resolver"
			}
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
		ipv6: true,
		'respect-rules': true,
		'enhanced-mode': 'fake-ip',
		nameserver: [
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
	proxies: [],
	'proxy-groups': [],
};