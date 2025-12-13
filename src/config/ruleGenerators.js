/**
 * Rule Generators
 * Functions for generating rules and rule sets
 */

import { UNIFIED_RULES, PREDEFINED_RULE_SETS, SITE_RULE_SETS, IP_RULE_SETS, CLASH_SITE_RULE_SETS, CLASH_IP_RULE_SETS } from './rules.js';
import { SITE_RULE_SET_BASE_URL, IP_RULE_SET_BASE_URL, CLASH_SITE_RULE_SET_BASE_URL, CLASH_IP_RULE_SET_BASE_URL } from './ruleUrls.js';

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
			site_rules: rule.site ? rule.site.split(',') : [],
			ip_rules: rule.ip ? rule.ip.split(',') : [],
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

	if (!selectedRules.includes('Non-China')) {
		site_rule_sets.push({
			tag: 'geolocation-!cn',
			type: 'remote',
			format: 'binary',
			url: `${SITE_RULE_SET_BASE_URL}geosite-geolocation-!cn.srs`,
		});
	}

	if (customRules) {
		customRules.forEach(rule => {
			if (rule.site && rule.site != '') {
				rule.site.split(',').forEach(site => {
					site_rule_sets.push({
						tag: site.trim(),
						type: 'remote',
						format: 'binary',
						url: `${SITE_RULE_SET_BASE_URL}geosite-${site.trim()}.srs`,
					});
				});
			}
			if (rule.ip && rule.ip != '') {
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
	if (!selectedRules.includes('Non-China')) {
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
	if (customRules) {
		customRules.forEach(rule => {
			if (rule.site && rule.site != '') {
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
			if (rule.ip && rule.ip != '') {
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
