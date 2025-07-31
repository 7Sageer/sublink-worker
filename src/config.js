import { t } from './i18n';

export const SITE_RULE_SET_BASE_URL = 'https://gh-proxy.com/https://raw.githubusercontent.com/lyc8503/sing-box-rules/refs/heads/rule-set-geosite/';
export const IP_RULE_SET_BASE_URL = 'https://gh-proxy.com/https://raw.githubusercontent.com/lyc8503/sing-box-rules/refs/heads/rule-set-geoip/';
export const CLASH_SITE_RULE_SET_BASE_URL = 'https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/';
export const CLASH_IP_RULE_SET_BASE_URL = 'https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geoip/';
export const SURGE_SITE_RULE_SET_BASEURL = 'https://gh-proxy.com/https://github.com/NSZA156/surge-geox-rules/raw/refs/heads/release/geo/geosite/'
export const SURGE_IP_RULE_SET_BASEURL = 'https://gh-proxy.com/https://github.com/NSZA156/surge-geox-rules/raw/refs/heads/release/geo/geoip/'
// Custom rules
export const CUSTOM_RULES = [];
// Unified rule structure
export const UNIFIED_RULES = [
	{
		name: 'Ad Block',
		outbound: t('outboundNames.Ad Block'),
		site_rules: ['category-ads-all'],
		ip_rules: []
	},
	{
		name: 'AI Services',
		outbound: t('outboundNames.AI Services'),
		site_rules: ['category-ai-!cn',],
		ip_rules: []
	},
	{
		name: 'Bilibili',
		outbound: t('outboundNames.Bilibili'),
		site_rules: ['bilibili'],
		ip_rules: []
	},
	{
		name: 'Youtube',
		outbound: t('outboundNames.Youtube'),
		site_rules: ['youtube'],
		ip_rules: []
	},
	{
		name: 'Google',
		outbound: t('outboundNames.Google'),
		site_rules: ['google'],
		ip_rules: ['google']
	},
	{
		name: 'Private',
		outbound: t('outboundNames.Private'),
		site_rules: [],
		ip_rules: ['private']
	},
	{
		name: 'Location:CN',
		outbound: t('outboundNames.Location:CN'),
		site_rules: ['geolocation-cn','cn'],
		ip_rules: ['cn']
	},
	{
		name: 'Telegram',
		outbound: t('outboundNames.Telegram'),
		site_rules: [],
		ip_rules: ['telegram']
	},
	{
		name: 'Github',
		outbound: t('outboundNames.Github'),
		site_rules: ['github', 'gitlab'],
		ip_rules: []
	},
	{
		name: 'Microsoft',
		outbound: t('outboundNames.Microsoft'),
		site_rules: ['microsoft'],
		ip_rules: []
	},
	{
		name: 'Apple',
		outbound: t('outboundNames.Apple'),
		site_rules: ['apple'],
		ip_rules: []
	},
	{
		name: 'Social Media',
		outbound: t('outboundNames.Social Media'),
		site_rules: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin'],
		ip_rules: []
	},
	{
		name: 'Streaming',
		outbound: t('outboundNames.Streaming'),
		site_rules: ['netflix', 'hulu', 'disney', 'hbo', 'amazon','bahamut'],
		ip_rules: []
	},
	{
		name: 'Gaming',
		outbound: t('outboundNames.Gaming'),
		site_rules: ['steam', 'epicgames', 'ea', 'ubisoft', 'blizzard'],
		ip_rules: []
	},
	{
		name: 'Education',
		outbound: t('outboundNames.Education'),
		site_rules: ['coursera', 'edx', 'udemy', 'khanacademy', 'category-scholar-!cn'],
		ip_rules: []
	},
	{
		name: 'Financial',
		outbound: t('outboundNames.Financial'),
		site_rules: ['paypal', 'visa', 'mastercard','stripe','wise'],
		ip_rules: []
	},
	{
		name: 'Cloud Services',
		outbound: t('outboundNames.Cloud Services'),
		site_rules: ['aws', 'azure', 'digitalocean', 'heroku', 'dropbox'],
		ip_rules: []
	},
	{
		name: 'Non-China',
		outbound: t('outboundNames.Non-China'),
		site_rules: ['geolocation-!cn'],
		ip_rules: []
	}
];

export const PREDEFINED_RULE_SETS = {
	minimal: ['Location:CN', 'Private', 'Non-China'],
	balanced: ['Location:CN', 'Private', 'Non-China','Github', 'Google', 'Youtube', 'AI Services', 'Telegram'],
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

// Generate CLASH_SITE_RULE_SETS and CLASH_IP_RULE_SETS for .mrs format
export const CLASH_SITE_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.site_rules.forEach(site_rule => {
		acc[site_rule] = `${site_rule}.mrs`;
	});
	return acc;
}, {});

export const CLASH_IP_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.ip_rules.forEach(ip_rule => {
		acc[ip_rule] = `${ip_rule}.mrs`;
	});
	return acc;
}, {});

// Helper function to get outbounds based on selected rule names
export function getOutbounds(selectedRuleNames) {
    if (!selectedRuleNames || !Array.isArray(selectedRuleNames)) {
        return [];
    }
    return UNIFIED_RULES
      .filter(rule => selectedRuleNames.includes(rule.name))
      .map(rule => rule.name);
}

// Helper function to generate rules based on selected rule names
export function generateRules(selectedRules = [], customRules = []) {
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
		  outbound: rule.name
		});
	  }
	});
  
	customRules.reverse();
	customRules.forEach((rule) => {
		rules.unshift({
			site_rules: rule.site.split(','),
			ip_rules: rule.ip.split(','),
			domain_suffix: rule.domain_suffix ? rule.domain_suffix.split(',') : [],
			domain_keyword: rule.domain_keyword ? rule.domain_keyword.split(',') : [],
			ip_cidr: rule.ip_cidr ? rule.ip_cidr.split(',') : [],
			protocol: rule.protocol ? rule.protocol.split(',') : [],
			outbound: rule.name
		});
		});
  
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
  }));

  const ip_rule_sets = Array.from(ipRuleSets).map(rule => ({
    tag: `${rule}-ip`,
    type: 'remote',
    format: 'binary',
    url: `${IP_RULE_SET_BASE_URL}${IP_RULE_SETS[rule]}`,
  }));

  if(!selectedRules.includes('Non-China')){
	site_rule_sets.push({
		tag: 'geolocation-!cn',
		type: 'remote',
		format: 'binary',
		url: `${SITE_RULE_SET_BASE_URL}geosite-geolocation-!cn.srs`,
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
				});
			});
		}
	});
	}

  ruleSets.push(...site_rule_sets, ...ip_rule_sets);

  return { site_rule_sets, ip_rule_sets };
}

// Generate rule sets for Clash using .mrs format
export function generateClashRuleSets(selectedRules = [], customRules = []) {
  if (typeof selectedRules === 'string' && PREDEFINED_RULE_SETS[selectedRules]) {
    selectedRules = PREDEFINED_RULE_SETS[selectedRules];
  }
  
  if (!selectedRules || selectedRules.length === 0) {
    selectedRules = PREDEFINED_RULE_SETS.minimal;
  }

  const selectedRulesSet = new Set(selectedRules);

  const siteRuleSets = new Set();
  const ipRuleSets = new Set();

  UNIFIED_RULES.forEach(rule => {
    if (selectedRulesSet.has(rule.name)) {
      rule.site_rules.forEach(siteRule => siteRuleSets.add(siteRule));
      rule.ip_rules.forEach(ipRule => ipRuleSets.add(ipRule));
    }
  });

  const site_rule_providers = {};
  const ip_rule_providers = {};

  Array.from(siteRuleSets).forEach(rule => {
    site_rule_providers[rule] = {
      type: 'http',
      format: 'mrs',
      behavior: 'domain',
      url: `${CLASH_SITE_RULE_SET_BASE_URL}${CLASH_SITE_RULE_SETS[rule]}`,
      path: `./ruleset/${CLASH_SITE_RULE_SETS[rule]}`,
      interval: 86400
    };
  });

  Array.from(ipRuleSets).forEach(rule => {
    ip_rule_providers[rule] = {
      type: 'http',
      format: 'mrs',
      behavior: 'ipcidr',
      url: `${CLASH_IP_RULE_SET_BASE_URL}${CLASH_IP_RULE_SETS[rule]}`,
      path: `./ruleset/${CLASH_IP_RULE_SETS[rule]}`,
      interval: 86400
    };
  });

  // Add Non-China rule set if not included
  if(!selectedRules.includes('Non-China')){
    site_rule_providers['geolocation-!cn'] = {
      type: 'http',
      format: 'mrs',
      behavior: 'domain',
      url: `${CLASH_SITE_RULE_SET_BASE_URL}geolocation-!cn.mrs`,
      path: './ruleset/geolocation-!cn.mrs',
      interval: 86400
    };
  }

  // Add custom rules
  if(customRules){
    customRules.forEach(rule => {
      if(rule.site!=''){
        rule.site.split(',').forEach(site => {
          const site_trimmed = site.trim();
          site_rule_providers[site_trimmed] = {
            type: 'http',
            format: 'mrs',
            behavior: 'domain',
            url: `${CLASH_SITE_RULE_SET_BASE_URL}${site_trimmed}.mrs`,
            path: `./ruleset/${site_trimmed}.mrs`,
            interval: 86400
          };
        });
      }
      if(rule.ip!=''){
        rule.ip.split(',').forEach(ip => {
          const ip_trimmed = ip.trim();
          ip_rule_providers[ip_trimmed] = {
            type: 'http',
            format: 'mrs',
            behavior: 'ipcidr',
            url: `${CLASH_IP_RULE_SET_BASE_URL}${ip_trimmed}.mrs`,
            path: `./ruleset/${ip_trimmed}.mrs`,
            interval: 86400
          };
        });
      }
    });
  }

  return { site_rule_providers, ip_rule_providers };
}

// Singbox configuration
export const SING_BOX_CONFIG = {
	
    "log": {
        "disabled": true,
        "level": "debug",
        "output": "Nekobox.log",
        "timestamp": true
    },
    "dns": {
        "servers": [
            {
                "tag": "google-dns",
                "address": "tls://dns.google",
                "address_resolver": "dns-local",
                "address_strategy": "prefer_ipv4",
                "strategy": "ipv4_only",
                "detour": "🚀 Latency"
            },
            {
                "tag": "cloudflare-dns",
                "address": "https://cloudflare-dns.com/dns-query",
                "address_resolver": "dns-local",
                "address_strategy": "prefer_ipv4",
                "strategy": "ipv4_only",
                "detour": ""
            },
            {
                "tag": "dns-local",
                "address": "local",
                "address_resolver": "local",
                "address_strategy": "prefer_ipv4",
                "strategy": "ipv4_only"
            },
            {
                "tag": "block-dns",
                "address": "rcode://success",
                "detour": "block"
            }
        ],
        "rules": [
            {
                "domain": [
                    "plus-store.naver.com",
                    "ava.game.naver.com",
                    "investor.fb.com",
                    "investors.spotify.com",
                    "nontontv.vidio.com",
                    "support.vidio.com",
                    "img.email2.vidio.com",
                    "quiz.int.vidio.com",
                    "quiz.vidio.com"
                ],
                "server": "dns-local"
            },
            {
                "network": "udp",
                "port": 443,
                "action": "reject",
                "method": "drop"
            },
            {
                "domain": [
               
                    
                    
                ],
                "server": "google-dns",
                "action": "route"
            },
            {
                "outbound": "🚀 Latency",
                "server": "google-dns",
                "rewrite_ttl": 7200
            },
            {
                "outbound": "",
                "server": "block-dns"
            },
            {
                "outbound": "",
                "server": "block-dns"
            },
            {
                "rule_set": [
                    "geosite-facebook1",
                    "geosite-facebook3",
                    "facebook-dev",
                    "facebook-ipcidr",
                    "geosite-instagram",
                    "geosite-discord",
                    "geosite-tiktok",
                    "AS32934",
                    "Google-AS15169",
                    "google-ipcidr",
                    "google-scholar",
                    "speedtest",
                    "messenger"
                ],
                "outbound": "",
                "action": "route",
                "server": "dns-local",
                "rewrite_ttl": 7200
            },
            {
                "domain_suffix": [
                    "dailymotion.com",
                    "dm-event.net",
                    "dmcdn.net",
                    "maki.my.id",
                    "kuramanime.run",
                    "filemoon.sx",
                    "mega.co.nz",
                    "ghbrisk.com"
                ],
                "rule_set": [
                    "geosite-youtube",
                    "geosite-openai",
                    "geosite-google",
                    "geoip-id"
                ],
                "outbound": "",
                "action": "route",
                "server": "google-dns",
                "rewrite_ttl": 7200
            }
        ],
        "strategy": "ipv4_only",
        "independent_cache": true
    },
    "inbounds": [
        {
            "type": "tun",
            "tag": "tun-in",
            "interface_name": "tunelm0n",
            "mtu": 1590,
            "address": [
                "172.18.0.1/30",
                "fdfe:dcba:9876::1/126"
            ],
            "auto_route": true,
            "strict_route": true,
            "stack": "gvisor",
            "sniff": true,
            "endpoint_independent_nat": true
        },
        {
            "type": "mixed",
            "tag": "mixed-in",
            "listen": "0.0.0.0",
            "listen_port": 2080,
            "tcp_fast_open": true,
            "sniff": true,
            "sniff_override_destination": true
        },
        {
            "type": "socks",
            "tag": "socks-in",
            "listen": "0.0.0.0",
            "listen_port": 2082,
            "tcp_fast_open": true
        },
        {
            "type": "direct",
            "tag": "direct-in",
            "override_address": "112.215.203.246",
            "override_port": 53
        }
    ],
    "outbounds": [
        {
            "type": "selector",
            "tag": "",
            "outbounds": [
                "🚀 Latency",
                "direct-out"
            ],
            "default": ""
        },
        {
            "type": "urltest",
            "tag": "",
            "outbounds": [
                

            ],
            "url": "https://connectivitycheck.gstatic.com/generate_204",
            "interval": "1m30s",
            "tolerance": 60,
            "idle_timeout": "5m0s"
        },
        {
            "type": "selector",
            "tag": "",
            "outbounds": [
                "block",
                ""
            ]
        },
        {
            "type": "selector",
            "tag": "",
            "outbounds": [
                "block",
                ""
            ]
        },
        {
            "type": "selector",
            "tag": "📞 Rule-WA",
            "outbounds": [
                "direct-out",
                ""
            ],
            "default": ""
        },
        {
            "type": "direct",
            "tag": "direct-out"
        },
        {
            "type": "block",
            "tag": "block"
        },
        

    ],
    "route": {
        "rules": [
            {
                "type": "logical",
                "mode": "or",
                "rules": [
                    {
                        "protocol": "dns"
                    },
                    {
                        "port": 53
                    }
                ],
                "action": "hijack-dns"
            },
            {
                "rule_set": [
                    "pornholeindo",
                    "category-porn",
                    "nsfw-onlydomains",
                    "porn-ags"
                ],
                "domain_keyword": [
                    "avtube"
                ],
                "outbound": ""
            },
            {
                "rule_set": [
                    "geosite-rule-ads",
                    "Ads-Adaway",
                    "Ads-Abpindo",
                    "GoodbyeAds-YouTube-AdBlock-Filter",
                    "gambling-ags",
                    "gambling-onlydomains",
                    "native.amazon",
                    "native.oppo-realme",
                    "native.tiktok.extended",
                    "native.tiktok",
                    "native.vivo",
                    "native.xiaomi"
                ],
                "domain_keyword": [
                    "data togel"
                ],
                "outbound": ""
            },
            {
                "domain_suffix": [
                    "dailymotion.com",
                    "maki.my.id",
                    "kuramanime.run",
                    "filemoon.sx",
                    "mega.co.nz",
                    "ghbrisk.com"
                ],
                "rule_set": [
                    "geosite-youtube",
                    "geosite-openai",
                    "geosite-google",
                    "geoip-id"
                ],
                "inbound": [
                    "direct-in"
                ],
                "outbound": "🚀 节点选择",
                "action": "route"
            },
            {
                "inbound": [
                    "direct-in"
                ],
                "rule_set": [
                    "geosite-wa"
                ],
                "domain_suffix": [
                    "wa.me",
                    "whatsapp-plus.info",
                    "whatsapp-plus.me",
                    "whatsapp-plus.net",
                    "whatsapp.cc",
                    "whatsapp.biz",
                    "whatsapp.com",
                    "whatsapp.info",
                    "whatsapp.net",
                    "whatsapp.org",
                    "whatsapp.tv",
                    "whatsappbrand.com",
                    "graph.whatsapp.com",
                    "graph.whatsapp.net"
                ],
                "domain": [
                    "graph.facebook.com"
                ],
                "domain_keyword": [
                    "whatsapp"
                ],
                "ip_cidr": [
                    "158.85.224.160/27",
                    "158.85.46.128/27",
                    "158.85.5.192/27",
                    "173.192.222.160/27",
                    "173.192.231.32/27",
                    "18.194.0.0/15",
                    "184.173.128.0/17",
                    "208.43.122.128/27",
                    "34.224.0.0/12",
                    "50.22.198.204/30",
                    "54.242.0.0/15"
                ],
                "outbound": "📞 Rule-WA",
                "ip_is_private": true
            },
            {
                "ip_is_private": true,
                "rule_set": "geoip-id",
                "outbound": "🚀 节点选择"
            },
            {
                "rule_set": [
                    "geosite-facebook1",
                    "geosite-facebook3",
                    "facebook-dev",
                    "facebook-ipcidr",
                    "geosite-instagram",
                    "geosite-discord",
                    "geosite-tiktok",
                    "AS32934",
                    "Google-AS15169",
                    "google-ipcidr",
                    "google-scholar",
                    "speedtest",
                    "messenger"
                ],
                "inbound": [
                    "direct-in"
                ],
                "outbound": "🚀 节点选择",
                "action": "route"
            }
        ],
        "rule_set": [
            {
                "type": "remote",
                "tag": "geosite-rule-ads",
                "format": "binary",
                "url": "https://github.com/dickymuliafiqri/sing-box-examples/releases/download/latest/geosite-rule-ads.srs",

            },
            {
                "type": "remote",
                "tag": "Ads-Adaway",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/adaway.srs",
                
            },
            {
                "type": "remote",
                "tag": "Ads-Abpindo",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/abpindo.srs",
                
            },
            {
                "type": "remote",
                "tag": "pornholeindo",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/pornholeindo.srs",
               
            },
            {
                "type": "remote",
                "tag": "category-porn",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/category-porn.srs",

            },
            {
                "type": "remote",
                "tag": "geoip-id",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/id.srs",
                
            },
            {
                "type": "remote",
                "tag": "geosite-facebook1",
                "format": "binary",
                "url": "https://github.com/malikshi/sing-box-geo/raw/refs/heads/rule-set-geosite/geosite-facebook.srs",

            },
            {
                "type": "remote",
                "tag": "geosite-facebook3",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/facebook.srs",
            
            },
            {
                "type": "remote",
                "tag": "facebook-dev",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/facebook-dev.srs",
                
            },
            {
                "type": "remote",
                "tag": "facebook-ipcidr",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/facebook.srs",
               
            },
            {
                "type": "remote",
                "tag": "geosite-instagram",
                "format": "binary",
                "url": "https://github.com/malikshi/sing-box-geo/raw/refs/heads/rule-set-geosite/geosite-instagram.srs",
               
            },
            {
                "type": "remote",
                "tag": "messenger",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/messenger.srs",
              
            },
            {
                "type": "remote",
                "tag": "geosite-youtube",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/youtube.srs",
               
            },
            {
                "type": "remote",
                "tag": "geosite-openai",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/openai.srs",

            },
            {
                "type": "remote",
                "tag": "geosite-wa",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/whatsapp.srs",

            },
            {
                "type": "remote",
                "tag": "geosite-google",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/google.srs",
                
            },
            {
                "type": "remote",
                "tag": "google-ipcidr",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/google.srs",

            },
            {
                "type": "remote",
                "tag": "geosite-discord",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/discord.srs",
                
            },
            {
                "type": "remote",
                "tag": "geosite-tiktok",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/tiktok.srs",
              
            },
            {
                "type": "remote",
                "tag": "AS32934",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/asn/AS132934.srs",
                
            },
            {
                "type": "remote",
                "tag": "Google-AS15169",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/asn/AS15169.srs",
               
            },
            {
                "type": "remote",
                "tag": "google-scholar",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/google-scholar.srs",
                
            },
            {
                "type": "remote",
                "tag": "speedtest",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/speedtest.srs",
                
            },
            {
                "type": "remote",
                "tag": "GoodbyeAds-YouTube-AdBlock-Filter",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/GoodbyeAds-YouTube-AdBlock-Filter.srs",
                
            },
            {
                "type": "remote",
                "tag": "gambling-ags",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/gambling-ags.srs",
               
            },
            {
                "type": "remote",
                "tag": "gambling-onlydomains",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/gambling-onlydomains.srs",
                
            },
            {
                "type": "remote",
                "tag": "native.amazon",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.amazon.srs",
              
            },
            {
                "type": "remote",
                "tag": "native.oppo-realme",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.oppo-realme.srs",
               
            },
            {
                "type": "remote",
                "tag": "native.tiktok.extended",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.tiktok.extended.srs",
                
            },
            {
                "type": "remote",
                "tag": "native.tiktok",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.tiktok.srs",
               
            },
            {
                "type": "remote",
                "tag": "native.vivo",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.vivo.srs",
                
            },
            {
                "type": "remote",
                "tag": "native.xiaomi",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.xiaomi.srs",

            },
            {
                "type": "remote",
                "tag": "nsfw-onlydomains",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/nsfw-onlydomains.srs",
                
            },
            {
                "type": "remote",
                "tag": "porn-ags",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/porn-ags.srs",

            }
        ],
        "final": "",
        "auto_detect_interface": true
    },
    "experimental": {
        "clash_api": {
            "external_controller": "0.0.0.0:9090",
            "external_ui": "dist",
            "external_ui_download_url": "https://github.com/Zephyruso/zashboard/releases/latest/download/dist-cdn-fonts.zip",
            "external_ui_download_detour": "🌐 Internet",
            "default_mode": "rule",
            "access_control_allow_origin": "*"
        }
    }
}

export const CLASH_CONFIG = {
  "mixed-port": 7890,
  "mode": "rule",
  "unified-delay": true,
  "log-level": "error",
  "ipv6": false,
  "external-controller": "127.0.0.1:9090",
  "external-ui": "",
  "external-ui-url": "",
  "external-ui-name": "",
  "secret": "143772bab9dfbb86",
  "find-process-mode": "always",
  "global-client-fingerprint": "chrome",
  "keep-alive-idle": 30,
  "keep-alive-interval": 30,
  "disable-keep-alive": false,
  "dns": {
    "enable": true,
    "prefer-h3": true,
    "ipv6": false,
    "ipv6-timeout": 300,
    "use-hosts": true,
    "use-system-hosts": true,
    "respect-rules": false,
    "nameserver": [
      "223.5.5.5",
      "119.29.29.29",
      "8.8.8.8",
      "8.8.4.4",
      "1.0.0.1",
      "1.1.1.1",
      "tls://223.5.5.5:853",
      "tls://8.8.8.8",
      "tls://8.8.4.4",
      "tls://1.0.0.1",
      "tls://1.1.1.1",
      "https://dns.alidns.com/dns-query#h3=true",
      "https://mozilla.cloudflare-dns.com/dns-query#DNS&h3=true",
      "quic://dns.adguard.com:784",
      "system"
    ],
    "fallback": [],
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "172.19.0.1/16",
    "fake-ip-filter": [
      "*.lan",
      "*.local",
      "time.*.com",
      "time.*.gov",
      "time.*.edu.cn",
      "time.*.apple.com",
      "time-ios.apple.com",
      "time1.*.com",
      "time2.*.com",
      "time3.*.com",
      "time4.*.com",
      "time5.*.com",
      "time6.*.com",
      "time7.*.com",
      "ntp.*.com",
      "ntp1.*.com",
      "ntp2.*.com",
      "ntp3.*.com",
      "ntp4.*.com",
      "ntp5.*.com",
      "ntp6.*.com",
      "ntp7.*.com",
      "*.time.edu.cn",
      "*.ntp.org.cn",
      "*.pool.ntp.org",
      "+.services.googleapis.cn",
      "+.push.apple.com",
      "time1.cloud.tencent.com",
      "localhost.ptlogin2.qq.com",
      "+.stun.*.*",
      "+.stun.*.*.*",
      "+.stun.*.*.*.*",
      "+.stun.*.*.*.*.*",
      "lens.l.google.com",
      "*.n.n.srv.nintendo.net",
      "+.stun.playstation.net",
      "xbox.*.*.microsoft.com",
      "*.*.xboxlive.com",
      "*.msftncsi.com",
      "*.msftconnecttest.com",
      "*.mcdn.bilivideo.cn",
      "+.bilibili.com",
      "+.bilicdn.com",
      "+.bilivideo.com",
      "+.market.xiaomi.com",
      "WORKGROUP"
    ],
    "fake-ip-filter-mode": "blacklist",
    "default-nameserver": [
      "223.5.5.5",
      "119.29.29.29",
      "8.8.8.8",
      "8.8.4.4",
      "1.0.0.1",
      "1.1.1.1",
      "system"
    ],
    "cache-algorithm": "arc",
    "proxy-server-nameserver": [],
    "direct-nameserver": [],
    "direct-nameserver-follow-policy": false
  },
  "tun": {
    "enable": true,
    "device": "Clash Mi",
    "stack": "gvisor",
    "dns-hijack": [
      "0.0.0.0:53"
    ],
    "auto-route": false,
    "auto-detect-interface": false,
    "mtu": 9000,
    "inet4-address": [
      "172.19.0.1/30"
    ],
    "auto-redirect": false
  },
  "profile": {
    "store-selected": true,
    "store-fake-ip": true
  },
  "extension": {
    "geo-rule-set": {
      "geosite_url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite",
      "geoip_url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geoip",
      "asn_url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/asn",
      "update-interval": 172800,
      "enable-proxy": true
    },
    "tun": {
      "http_proxy": {
        "enable": false,
        "bypass_domain": [
          "<-loopback>",
          "<local>",
          "localhost",
          "*.local",
          "127.*",
          "10.*",
          "172.16.*",
          "172.17.*",
          "172.18.*",
          "172.19.*",
          "172.2*",
          "172.30.*",
          "172.31.*",
          "192.168.*",
          "*zhihu.com",
          "*zhimg.com",
          "*jd.com",
          "100ime-iat-api.xfyun.cn",
          "*360buyimg.com"
        ]
      },
      "per_app": {
        "enable": false
      }
    },
    "runtime-profile-save-path": "/data/user/0/com.nebula.clashmi/files/service_core_runtime_profile.yaml"
  }
}

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
