/**
 * Subconverter Configuration Generator
 * Generates subconverter external config file (INI format) from unified rules
 */

import { generateRules } from './ruleGenerators.js';
import { createTranslator } from '../i18n/index.js';

// Rule names that should default to REJECT
const REJECT_RULES = new Set(['Ad Block']);

// Rule names that should default to DIRECT
const DIRECT_RULES = new Set(['Private', 'Location:CN']);

/**
 * Generate subconverter external config (INI format)
 * @param {object} options
 * @param {string[]|string} options.selectedRules - Selected rule names or preset name
 * @param {object[]} options.customRules - Custom rule definitions
 * @param {string} options.lang - Language for group name translation
 * @param {boolean} options.includeAutoSelect - Whether to include auto select group
 * @returns {string} INI format config string
 */
export function generateSubconverterConfig({ selectedRules = [], customRules = [], lang = 'zh-CN', includeAutoSelect = true } = {}) {
	const t = createTranslator(lang);
	const rules = generateRules(selectedRules, customRules);

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

	// Node Select group (top-level selector)
	if (includeAutoSelect) {
		lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]${autoSelectName}\`[]DIRECT\`.*`);
		lines.push(`custom_proxy_group=${autoSelectName}\`url-test\`.*\`http://www.gstatic.com/generate_204\`300,,50`);
	} else {
		lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]DIRECT\`.*`);
	}

	// Rule outbound groups
	const processedGroups = new Set([nodeSelectName]);
	if (includeAutoSelect) processedGroups.add(autoSelectName);

	rules.forEach(rule => {
		const groupName = t(`outboundNames.${rule.outbound}`);
		if (processedGroups.has(groupName)) return;
		processedGroups.add(groupName);

		if (REJECT_RULES.has(rule.outbound)) {
			lines.push(`custom_proxy_group=${groupName}\`select\`[]REJECT\`[]DIRECT`);
		} else if (DIRECT_RULES.has(rule.outbound)) {
			lines.push(`custom_proxy_group=${groupName}\`select\`[]DIRECT\`[]${nodeSelectName}`);
		} else {
			if (includeAutoSelect) {
				lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]DIRECT\`.*`);
			} else {
				lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]DIRECT\`.*`);
			}
		}
	});

	// Fall Back group (if not already created by a rule)
	if (!processedGroups.has(fallBackName)) {
		if (includeAutoSelect) {
			lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]DIRECT\`.*`);
		} else {
			lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]DIRECT\`.*`);
		}
	}

	// Config flags
	lines.push('');
	lines.push('enable_rule_generator=true');
	lines.push('overwrite_original_rules=true');

	return lines.join('\n');
}
