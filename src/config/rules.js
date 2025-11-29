/**
 * Rule Definitions
 * Contains unified rule structure and predefined rule sets
 */

export const CUSTOM_RULES = [];

export const UNIFIED_RULES = [
	{
		name: 'Ad Block',
		site_rules: ['category-ads-all'],
		ip_rules: []
	},
	{
		name: 'AI Services',
		site_rules: ['category-ai-!cn',],
		ip_rules: []
	},
	{
		name: 'Bilibili',
		site_rules: ['bilibili'],
		ip_rules: []
	},
	{
		name: 'Youtube',
		site_rules: ['youtube'],
		ip_rules: []
	},
	{
		name: 'Google',
		site_rules: ['google'],
		ip_rules: ['google']
	},
	{
		name: 'Private',
		site_rules: [],
		ip_rules: ['private']
	},
	{
		name: 'Location:CN',
		site_rules: ['geolocation-cn', 'cn'],
		ip_rules: ['cn']
	},
	{
		name: 'Telegram',
		site_rules: [],
		ip_rules: ['telegram']
	},
	{
		name: 'Github',
		site_rules: ['github', 'gitlab'],
		ip_rules: []
	},
	{
		name: 'Microsoft',
		site_rules: ['microsoft'],
		ip_rules: []
	},
	{
		name: 'Apple',
		site_rules: ['apple'],
		ip_rules: []
	},
	{
		name: 'Social Media',
		site_rules: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin'],
		ip_rules: []
	},
	{
		name: 'Streaming',
		site_rules: ['netflix', 'hulu', 'disney', 'hbo', 'amazon', 'bahamut'],
		ip_rules: []
	},
	{
		name: 'Gaming',
		site_rules: ['steam', 'epicgames', 'ea', 'ubisoft', 'blizzard'],
		ip_rules: []
	},
	{
		name: 'Education',
		site_rules: ['coursera', 'edx', 'udemy', 'khanacademy', 'category-scholar-!cn'],
		ip_rules: []
	},
	{
		name: 'Financial',
		site_rules: ['paypal', 'visa', 'mastercard', 'stripe', 'wise'],
		ip_rules: []
	},
	{
		name: 'Cloud Services',
		site_rules: ['aws', 'azure', 'digitalocean', 'heroku', 'dropbox'],
		ip_rules: []
	},
	{
		name: 'Non-China',
		site_rules: ['geolocation-!cn'],
		ip_rules: []
	}
];

export const PREDEFINED_RULE_SETS = {
	minimal: ['Location:CN', 'Private', 'Non-China'],
	balanced: ['Location:CN', 'Private', 'Non-China', 'Github', 'Google', 'Youtube', 'AI Services', 'Telegram'],
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
