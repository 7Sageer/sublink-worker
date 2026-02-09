/**
 * Subconverter Configuration Generator
 * Generates subconverter external config file (INI format) from unified rules
 */

import { createTranslator } from '../i18n/index.js';
import { generateRules } from './ruleGenerators.js';

// Rule names that should default to REJECT
const REJECT_RULES = new Set(['Ad Block']);

// Rule names that should default to DIRECT
const DIRECT_RULES = new Set(['Private', 'Location:CN']);

// Country data for regex-based grouping (mirrors parseCountryFromNodeName in utils.js)
const COUNTRY_DATA = [
	{ emoji: '🇭🇰', name: 'Hong Kong', aliases: ['香港', 'Hong Kong', 'HK'] },
	{ emoji: '🇹🇼', name: 'Taiwan', aliases: ['台湾', 'Taiwan', 'TW'] },
	{ emoji: '🇯🇵', name: 'Japan', aliases: ['日本', 'Japan', 'JP'] },
	{ emoji: '🇰🇷', name: 'Korea', aliases: ['韩国', 'Korea', 'KR'] },
	{ emoji: '🇸🇬', name: 'Singapore', aliases: ['新加坡', 'Singapore', 'SG'] },
	{ emoji: '🇺🇸', name: 'United States', aliases: ['美国', 'United States', 'US'] },
	{ emoji: '🇬🇧', name: 'United Kingdom', aliases: ['英国', 'United Kingdom', 'UK', 'GB'] },
	{ emoji: '🇩🇪', name: 'Germany', aliases: ['德国', 'Germany'] },
	{ emoji: '🇫🇷', name: 'France', aliases: ['法国', 'France'] },
	{ emoji: '🇷🇺', name: 'Russia', aliases: ['俄罗斯', 'Russia'] },
	{ emoji: '🇨🇦', name: 'Canada', aliases: ['加拿大', 'Canada'] },
	{ emoji: '🇦🇺', name: 'Australia', aliases: ['澳大利亚', 'Australia'] },
	{ emoji: '🇮🇳', name: 'India', aliases: ['印度', 'India'] },
	{ emoji: '🇧🇷', name: 'Brazil', aliases: ['巴西', 'Brazil'] },
	{ emoji: '🇿🇦', name: 'South Africa', aliases: ['南非', 'South Africa'] },
	{ emoji: '🇦🇷', name: 'Argentina', aliases: ['阿根廷', 'Argentina'] },
	{ emoji: '🇹🇷', name: 'Turkey', aliases: ['土耳其', 'Turkey'] },
	{ emoji: '🇳🇱', name: 'Netherlands', aliases: ['荷兰', 'Netherlands'] },
	{ emoji: '🇨🇭', name: 'Switzerland', aliases: ['瑞士', 'Switzerland'] },
	{ emoji: '🇸🇪', name: 'Sweden', aliases: ['瑞典', 'Sweden'] },
	{ emoji: '🇮🇹', name: 'Italy', aliases: ['意大利', 'Italy'] },
	{ emoji: '🇪🇸', name: 'Spain', aliases: ['西班牙', 'Spain'] },
	{ emoji: '🇮🇪', name: 'Ireland', aliases: ['爱尔兰', 'Ireland'] },
	{ emoji: '🇲🇾', name: 'Malaysia', aliases: ['马来西亚', 'Malaysia'] },
	{ emoji: '🇹🇭', name: 'Thailand', aliases: ['泰国', 'Thailand'] },
	{ emoji: '🇻🇳', name: 'Vietnam', aliases: ['越南', 'Vietnam'] },
	{ emoji: '🇵🇭', name: 'Philippines', aliases: ['菲律宾', 'Philippines'] },
	{ emoji: '🇮🇩', name: 'Indonesia', aliases: ['印度尼西亚', 'Indonesia'] },
	{ emoji: '🇳🇿', name: 'New Zealand', aliases: ['新西兰', 'New Zealand'] },
	{ emoji: '🇦🇪', name: 'United Arab Emirates', aliases: ['阿联酋', 'United Arab Emirates'] },
];

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
		COUNTRY_DATA.forEach(country => {
			const groupName = `${country.emoji} ${country.name}`;
			countryGroupNames.push(groupName);
			const regex = country.aliases.map(a => escapeRegex(a)).join('|');
			countryGroupLines.push(`custom_proxy_group=${groupName}\`url-test\`(${regex})\`${SPEED_TEST_URL}\`300,,50`);
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
		} else if (DIRECT_RULES.has(rule.outbound)) {
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
