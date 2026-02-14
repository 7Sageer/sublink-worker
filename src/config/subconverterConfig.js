/**
 * Subconverter Configuration Generator
 * Generates subconverter external config file (INI format) from unified rules
 */

import { createTranslator } from '../i18n/index.js';
import { generateRules } from './ruleGenerators.js';
import { COUNTRY_DATA } from '../utils.js';
import { DIRECT_DEFAULT_RULES } from './rules.js';

// Rule names that should default to REJECT
const REJECT_RULES = new Set(['Ad Block']);

const SPEED_TEST_URL = 'http://www.gstatic.com/generate_204';

/**
 * Escape special regex characters in a string for use inside subconverter regex
 */
function escapeRegex(str) {
	return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Build the member list suffix for a proxy group that references country groups.
 * Used by Node Select and rule outbound groups when groupByCountry is enabled.
 */
function buildCountryGroupRefs(countryGroupNames) {
	return countryGroupNames.map(name => `[]${name}`).join('`');
}

/**
 * Generate subconverter external config (INI format)
 * @param {object} options
 * @param {string[]|string} options.selectedRules - Selected rule names or preset name
 * @param {string} options.lang - Language for group name translation
 * @param {boolean} options.includeAutoSelect - Whether to include auto select group
 * @param {boolean} options.groupByCountry - Whether to group proxies by country
 * @returns {string} INI format config string
 */
export function generateSubconverterConfig({ selectedRules = [], lang = 'zh-CN', includeAutoSelect = true, groupByCountry = false } = {}) {
	const t = createTranslator(lang);
	const rules = generateRules(selectedRules);

	const lines = ['[custom]'];

	// --- Ruleset lines ---
	// Domain-type rules first, then IP-type rules (reduces DNS leaks, same as SurgeConfigBuilder)

	// First pass: domain-type rules (DOMAIN-SUFFIX, DOMAIN-KEYWORD, GEOSITE)
	rules.forEach(rule => {
		const groupName = t(`outboundNames.${rule.outbound}`);

		if (rule.domain_suffix) {
			rule.domain_suffix.forEach(suffix => {
				if (suffix) lines.push(`ruleset=${groupName},[]DOMAIN-SUFFIX,${suffix}`);
			});
		}
		if (rule.domain_keyword) {
			rule.domain_keyword.forEach(keyword => {
				if (keyword) lines.push(`ruleset=${groupName},[]DOMAIN-KEYWORD,${keyword}`);
			});
		}
		if (rule.site_rules) {
			rule.site_rules.forEach(site => {
				if (site) lines.push(`ruleset=${groupName},[]GEOSITE,${site}`);
			});
		}
	});

	// Second pass: IP-type rules (GEOIP, IP-CIDR)
	rules.forEach(rule => {
		const groupName = t(`outboundNames.${rule.outbound}`);

		if (rule.ip_rules) {
			rule.ip_rules.forEach(ip => {
				if (ip) lines.push(`ruleset=${groupName},[]GEOIP,${ip}`);
			});
		}
		if (rule.ip_cidr) {
			rule.ip_cidr.forEach(cidr => {
				if (cidr) lines.push(`ruleset=${groupName},[]IP-CIDR,${cidr}`);
			});
		}
	});

	// FINAL rule
	const fallBackName = t('outboundNames.Fall Back');
	lines.push(`ruleset=${fallBackName},[]FINAL`);

	// --- Proxy group lines ---
	lines.push('');

	const nodeSelectName = t('outboundNames.Node Select');
	const autoSelectName = t('outboundNames.Auto Select');
	const manualSwitchName = t('outboundNames.Manual Switch');

	// Pre-compute country group names and lines if groupByCountry is enabled
	const countryGroupNames = [];
	const countryGroupLines = [];

	if (groupByCountry) {
		Object.values(COUNTRY_DATA).forEach(country => {
			const groupName = `${country.emoji} ${country.name}`;
			countryGroupNames.push(groupName);
			const regex = country.aliases.map(a => {
				const escaped = escapeRegex(a);
				// Add word boundary for ASCII aliases to prevent substring matching (e.g. US matching AUS/RUS)
				return /^[A-Za-z\s]+$/.test(a) ? `\\b${escaped}\\b` : escaped;
			}).join('|');
			countryGroupLines.push(`custom_proxy_group=${groupName}\`url-test\`(?i)(${regex})\`${SPEED_TEST_URL}\`300,,50`);
		});
	}

	// Node Select group (top-level selector)
	if (groupByCountry) {
		const refs = buildCountryGroupRefs(countryGroupNames);
		if (includeAutoSelect) {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]${autoSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
		} else {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
		}
	} else {
		if (includeAutoSelect) {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]${autoSelectName}\`[]DIRECT\`.*`);
		} else {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]DIRECT\`.*`);
		}
	}

	// Auto Select group
	if (includeAutoSelect) {
		lines.push(`custom_proxy_group=${autoSelectName}\`url-test\`.*\`${SPEED_TEST_URL}\`300,,50`);
	}

	// Manual Switch group (when groupByCountry, provides access to all individual nodes)
	if (groupByCountry) {
		lines.push(`custom_proxy_group=${manualSwitchName}\`select\`.*`);
	}

	// Country groups (url-test per country with regex matching)
	countryGroupLines.forEach(line => lines.push(line));

	// Rule outbound groups
	const processedGroups = new Set([nodeSelectName]);
	if (includeAutoSelect) processedGroups.add(autoSelectName);
	if (groupByCountry) {
		processedGroups.add(manualSwitchName);
		countryGroupNames.forEach(name => processedGroups.add(name));
	}

	rules.forEach(rule => {
		const groupName = t(`outboundNames.${rule.outbound}`);
		if (processedGroups.has(groupName)) return;
		processedGroups.add(groupName);

		if (REJECT_RULES.has(rule.outbound)) {
			lines.push(`custom_proxy_group=${groupName}\`select\`[]REJECT\`[]DIRECT`);
		} else if (DIRECT_DEFAULT_RULES.has(rule.outbound)) {
			lines.push(`custom_proxy_group=${groupName}\`select\`[]DIRECT\`[]${nodeSelectName}`);
		} else {
			if (groupByCountry) {
				const refs = buildCountryGroupRefs(countryGroupNames);
				if (includeAutoSelect) {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
				} else {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
				}
			} else {
				if (includeAutoSelect) {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]DIRECT\`.*`);
				} else {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]DIRECT\`.*`);
				}
			}
		}
	});

	// Fall Back group (if not already created by a rule)
	if (!processedGroups.has(fallBackName)) {
		if (groupByCountry) {
			const refs = buildCountryGroupRefs(countryGroupNames);
			if (includeAutoSelect) {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
			} else {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
			}
		} else {
			if (includeAutoSelect) {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]DIRECT\`.*`);
			} else {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]DIRECT\`.*`);
			}
		}
	}

	// Config flags
	lines.push('');
	lines.push('enable_rule_generator=true');
	lines.push('overwrite_original_rules=true');

	return lines.join('\n');
}
