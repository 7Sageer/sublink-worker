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
	  {
		"geosite": "category-ads-all",
		"outbound": "🛑 广告拦截"
	  },
	  {
		"geosite": "openai",
		"outbound": "💬 OpenAi"
	  },
	  {
		"geosite": "biliintl",
		"outbound": "📺 哔哩哔哩国际"
	  },
	  {
		"geosite": "twitter",
		"outbound": "🌍 国外媒体"
	  },
	  {
		"geosite": "spotify",
		"outbound": "🌍 国外媒体"
	  },
	  {
		"geosite": "youtube",
		"outbound": "📹 油管视频"
	  },
	  {
		"geosite": "github",
		"outbound": "🐱 GitHub"
	  },
	  {
		"geosite": "google",
		"outbound": "🔍 谷歌服务"
	  },
	  {
		"geosite": "telegram",
		"outbound": "📲 电报消息"
	  },
	  {
		"geosite": "netflix",
		"outbound": "🎥 奈飞视频"
	  },
	  {
		"geosite": "bahamut",
		"outbound": "📺 巴哈姆特"
	  },
	  {
		"geosite": "geolocation-!cn",
		"outbound": "🌍 国外媒体"
	  },
	  {
		"geoip": "google",
		"outbound": "🔍 谷歌服务"
	  },
	  {
		"geoip": "netflix",
		"outbound": "🎥 奈飞视频"
	  },
	  {
		"geoip": "telegram",
		"outbound": "📲 电报消息"
	  },
	  {
		"geoip": "twitter",
		"outbound": "🌍 国外媒体"
	  },
	  {
		"geosite": "pixiv",
		"outbound": "🌍 国外媒体"
	  },
	  {
		"geosite": "CN",
		"outbound": "🇨🇳 国内服务"
	  },
	  {
		"geoip": "CN",
		"outbound": "🇨🇳 国内服务"
	  }
		
    ],
    "final": "🐟 漏网之鱼",
    "auto_detect_interface": true,
	"geoip": {
		"download_detour": "proxy"
	  },
	"geosite": {
		"download_detour": "proxy"
	},
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
export const SELECTORS_LIST =  ['🚀 节点选择', '🛑 广告拦截', '🌍 国外媒体', '🇨🇳 国内服务', '📲 电报消息', '💬 OpenAi', '📹 油管视频', '🎥 奈飞视频', '📺 巴哈姆特', '📺 哔哩哔哩国际', '🔍 谷歌服务', '🐱 GitHub', '🐟 漏网之鱼', 'GLOBAL']

export const CLASH_RULES = `
  # - AND,(AND,(DST-PORT,443),(NETWORK,UDP)),(NOT,((GEOSITE,cn))),REJECT # quic

  - GEOSITE,category-ads-all,🛑 广告拦截
  - GEOSITE,openai, 💬 OpenAi
  - GEOSITE,biliintl, 📺 哔哩哔哩国际
  - GEOSITE,twitter,🌍 国外媒体
  - GEOSITE,spotify,🌍 国外媒体
  - GEOSITE,youtube,📹 油管视频
  - GEOSITE,github, 🐱 GitHub
  - GEOSITE,google, 🔍 谷歌服务
  - GEOSITE,telegram,📲 电报消息
  - GEOSITE,netflix,🎥 奈飞视频
  - GEOSITE,bahamut,📺 巴哈姆特
  - GEOSITE,geolocation-!cn,🌍 国外媒体

  # - AND,(AND,(DST-PORT,443),(NETWORK,UDP)),(NOT,((GEOIP,CN))),REJECT # quic
  - GEOIP,google,🔍 谷歌服务
  - GEOIP,netflix,🎥 奈飞视频
  - GEOIP,telegram,📲 电报消息
  - GEOIP,twitter,🌍 国外媒体
  - GEOSITE,pixiv,🌍 国外媒体
  - GEOSITE,CN, 🇨🇳 国内服务
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
    'proxy-groups': [
		// 'name': '🐟 漏网之鱼',
		// 'type': 'select',
		// 'proxies': ['🚀 节点选择','DIRECT','REJECT']
	],
	rules: parsedRules,
};
