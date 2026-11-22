/**
 * Rule Set Base URLs
 * Contains base URLs for different rule set providers
 */

// gh-proxy.com now answers rule files with 403, which makes sing-box refuse to
// start (#460). jsDelivr is a CDN meant for serving GitHub files; its edge cache
// lags upstream by up to 12 hours, which is fine for rules updated daily.
export const SITE_RULE_SET_BASE_URL = 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/';
export const IP_RULE_SET_BASE_URL = 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/';
export const CLASH_SITE_RULE_SET_BASE_URL = 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/';
export const CLASH_IP_RULE_SET_BASE_URL = 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/';
export const SURGE_SITE_RULE_SET_BASEURL = 'https://fastly.jsdelivr.net/gh/NSZA156/surge-geox-rules@release/geo/geosite/'
export const SURGE_IP_RULE_SET_BASEURL = 'https://fastly.jsdelivr.net/gh/NSZA156/surge-geox-rules@release/geo/geoip/'
