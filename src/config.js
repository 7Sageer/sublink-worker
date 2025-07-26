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
{
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
                "detour": "🌐 Internet"
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
                "outbound": "🔞 Porn",
                "server": "block-dns"
            },
            {
                "outbound": "🎯 Ads",
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
                "outbound": "🌐 Internet",
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
                "outbound": "🌐 Internet",
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
            "tag": "🌐 Internet",
            "outbounds": [
                "🚀 Latency",
                "direct-out"
            ],
            "default": "🚀 Latency"
        },
        {
            "type": "urltest",
            "tag": "🚀 Latency",
            "outbounds": [
                

            ],
            "url": "https://connectivitycheck.gstatic.com/generate_204",
            "interval": "1m30s",
            "tolerance": 60,
            "idle_timeout": "5m0s"
        },
        {
            "type": "selector",
            "tag": "🔞 Porn",
            "outbounds": [
                "block",
                "🌐 Internet"
            ]
        },
        {
            "type": "selector",
            "tag": "🎯 Ads",
            "outbounds": [
                "block",
                "🌐 Internet"
            ]
        },
        {
            "type": "selector",
            "tag": "📞 Rule-WA",
            "outbounds": [
                "direct-out",
                "🌐 Internet"
            ],
            "default": "🌐 Internet"
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
                "outbound": "🔞 Porn"
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
                "outbound": "🎯 Ads"
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
                "outbound": "🌐 Internet",
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
                "outbound": "🌐 Internet"
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
                "outbound": "🌐 Internet",
                "action": "route"
            }
        ],
        "rule_set": [
            {
                "type": "remote",
                "tag": "geosite-rule-ads",
                "format": "binary",
                "url": "https://github.com/dickymuliafiqri/sing-box-examples/releases/download/latest/geosite-rule-ads.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "Ads-Adaway",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/adaway.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "Ads-Abpindo",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/abpindo.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "pornholeindo",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/pornholeindo.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "category-porn",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/category-porn.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geoip-id",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/id.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-facebook1",
                "format": "binary",
                "url": "https://github.com/malikshi/sing-box-geo/raw/refs/heads/rule-set-geosite/geosite-facebook.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-facebook3",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/facebook.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "facebook-dev",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/facebook-dev.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "facebook-ipcidr",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/facebook.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-instagram",
                "format": "binary",
                "url": "https://github.com/malikshi/sing-box-geo/raw/refs/heads/rule-set-geosite/geosite-instagram.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "messenger",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/messenger.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-youtube",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/youtube.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-openai",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/openai.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-wa",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/whatsapp.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-google",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/google.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "google-ipcidr",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geoip/google.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-discord",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/discord.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "geosite-tiktok",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo-lite/geosite/tiktok.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "AS32934",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/asn/AS132934.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "Google-AS15169",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/asn/AS15169.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "google-scholar",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/google-scholar.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "speedtest",
                "format": "binary",
                "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/speedtest.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "GoodbyeAds-YouTube-AdBlock-Filter",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/GoodbyeAds-YouTube-AdBlock-Filter.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "gambling-ags",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/gambling-ags.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "gambling-onlydomains",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/gambling-onlydomains.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "native.amazon",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.amazon.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "native.oppo-realme",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.oppo-realme.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "native.tiktok.extended",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.tiktok.extended.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "native.tiktok",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.tiktok.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "native.vivo",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.vivo.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "native.xiaomi",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/native.xiaomi.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "nsfw-onlydomains",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/nsfw-onlydomains.srs",
                "download_detour": "🌐 Internet"
            },
            {
                "type": "remote",
                "tag": "porn-ags",
                "format": "binary",
                "url": "https://github.com/Mayumiwandi/Lecilia/raw/refs/heads/main/Sing-box/new/porn-ags.srs",
                "download_detour": "🌐 Internet"
            }
        ],
        "final": "🌐 Internet",
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
