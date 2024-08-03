import yaml from 'js-yaml';

export const SING_BOX_CONFIG = {
	log : {
	disabled: false,
	level: 'info',
	timestamp: true,
	},
    dns : {
		"servers": [
			{
				"tag": "dns_proxy",
				"address": "tls://1.1.1.1",
				"address_resolver": "dns_resolver"
			},
			{
				"tag": "dns_direct",
				"address": "h3://dns.alidns.com/dns-query",
				"address_resolver": "dns_resolver",
				"detour": "DIRECT"
			},
			{
				"tag": "dns_fakeip",
				"address": "fakeip"
			},
			{
				"tag": "dns_resolver",
				"address": "223.5.5.5",
				"detour": "DIRECT"
			},
			{
				"tag": "block",
				"address": "rcode://success"
			}
		],
		"rules": [
			{
				"outbound": [
					"any"
				],
				"server": "dns_resolver"
			},
			{
				"geosite": [
					"category-ads-all"
				],
				"server": "dns_block",
				"disable_cache": true
			},
			{
				"geosite": [
					"geolocation-!cn"
				],
				"query_type": [
					"A",
					"AAAA"
				],
				"server": "dns_fakeip"
			},
			{
				"geosite": [
					"geolocation-!cn"
				],
				"server": "dns_proxy"
			}
		],
		"final": "dns_direct",
		"independent_cache": true,
		"fakeip": {
			"enabled": true,
			"inet4_range": "198.18.0.0/15"
		}
	}, 
	ntp : {
		"enabled": true,
		"server": "time.apple.com",
		"server_port": 123,
		"interval": "30m",
		"detour": "DIRECT"
	},
	inbounds : [
		{
			"type": "mixed",
			"tag": "mixed-in",
			"listen": "0.0.0.0",
			"listen_port": 2080
		},
		{
			"type": "tun",
			"tag": "tun-in",
			"inet4_address": "172.19.0.1/30",
			"auto_route": true,
			"strict_route": true,
			"stack": "mixed",
			"sniff": true
		}
	],
	
	outbounds : [
		{
			"type": "direct",
			"tag": "DIRECT"
		},
		{
			"type": "block",
			"tag": "REJECT"
		},
		{
			"type": "dns",
			"tag": "dns-out"
		}
	],

   "route": {
	"rules": [
		{
			"protocol": "dns",
			"port": 53,
			"outbound": "dns-out"
		  },
		  {
			"clash_mode": "direct",
			"outbound": "DIRECT"
		  },
		  {
			"clash_mode": "global",
			"outbound": "GLOBAL"
		},
		{ "rule_set": [ "ads" ], "outbound": "🛑 广告拦截" },
		{ "ip_is_private": true, "outbound": "🔒 私有网络" },
		{ "rule_set": [ "google-cn" ], "outbound": "🇬 谷歌服务" },
		{ "rule_set": [ "netflix" ], "outbound": "🎥 奈飞视频" },
		{ "rule_set": [ "youtube" ], "outbound": "📹 油管视频" },
		{ "rule_set": [ "bilibili" ], "outbound": "📺 哔哩哔哩" },
		{ "rule_set": [ "ai" ], "outbound": "💬 OpenAI" },
		{ "rule_set": [ "cn" ], "outbound": "🇨🇳 国内服务" },
		{ "rule_set": [ "netflixip" ], "outbound": "🎥 奈飞视频"},
		{ "rule_set": [ "telegramip" ], "outbound": "📲 电报消息"},
		{ "ip_is_private": true, "outbound": "🔒 私有网络"},
		{ "rule_set": [ "cnip" ], "outbound": "🇨🇳 国内服务" },
	],
	"auto_detect_interface": true,
	"final": "🐟 漏网之鱼",
	"rule_set": [
		{
			"tag": "ads",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geosite-adblockplus.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "google-cn",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geosite-google.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "netflix",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geosite-netflix.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "youtube",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geosite-youtube.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "bilibili",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geosite-bilibili.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "ai",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geosite-openai.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "cn",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geosite-cn.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "netflixip",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geoip-netflix.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "telegramip",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geoip-telegram.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "cnip",
			"type": "remote",
			"format": "binary",
			"url": "https://github.com/lyc8503/sing-box-rules/raw/rule-set-geosite/geoip-cn.srs",
			"download_detour": "⚡ 自动选择"
		},
		{
			"tag": "geosite-geolocation-!cn",
			"type": "remote",
			"format": "binary",
			"url": "https://raw.githubusercontent.com/SagerNet/sing-geosite/rule-set/geosite-geolocation-!cn.srs",
			"download_detour": "⚡ 自动选择"
		},
	]
	},

	experimental : {
		"cache_file": {
			"enabled": true,
			"store_fakeip": true
		},
		"clash_api": {
			"external_controller": "127.0.0.1:9090",
			"external_ui": "dashboard"
		}
	}
}
export const SELECTORS_LIST = ['🚀 节点选择', '🛑 广告拦截', '🌍 国外媒体', '🔒 私有网络', '🇨🇳 国内服务', '📲 电报消息', '💬 OpenAI', '📹 油管视频', '🎥 奈飞视频', '📺 哔哩哔哩', '🇬 谷歌服务', '🐟 漏网之鱼', 'GLOBAL']

export const CLASH_RULES = `
  # - AND,(AND,(DST-PORT,443),(NETWORK,UDP)),(NOT,((GEOSITE,cn))),REJECT # quic
  - GEOSITE,category-ads-all,🛑 广告拦截
  - GEOSITE,openai,💬 OpenAI
  - GEOSITE,biliintl,📺 哔哩哔哩
  - GEOSITE,bilibili,📺 哔哩哔哩
  - GEOSITE,twitter,🌍 国外媒体
  - GEOSITE,spotify,🌍 国外媒体
  - GEOSITE,youtube,📹 油管视频
  - GEOSITE,google,🇬 谷歌服务
  - GEOSITE,telegram,📲 电报消息
  - GEOSITE,netflix,🎥 奈飞视频
  - GEOSITE,geolocation-!cn,🌍 国外媒体
  # - AND,(AND,(DST-PORT,443),(NETWORK,UDP)),(NOT,((GEOIP,CN))),REJECT # quic
  - GEOIP,private,🔒 私有网络
  - GEOIP,google,🇬 谷歌服务
  - GEOIP,netflix,🎥 奈飞视频
  - GEOIP,telegram,📲 电报消息
  - GEOIP,twitter,🌍 国外媒体
  - GEOSITE,pixiv,🌍 国外媒体
  - GEOSITE,CN,🇨🇳 国内服务
  - GEOIP,CN,🇨🇳 国内服务
  - MATCH,🐟 漏网之鱼,🚀 节点选择
`;

const parsedRules = yaml.load(CLASH_RULES);

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
	rules: parsedRules,
};
