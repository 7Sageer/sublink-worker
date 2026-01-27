import yaml from 'js-yaml';
import { CLASH_CONFIG, generateRules, generateClashRuleSets, getOutbounds, PREDEFINED_RULE_SETS } from '../config/index.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { deepCopy, groupProxiesByCountry } from '../utils.js';
import { addProxyWithDedup } from './helpers/proxyHelpers.js';
import { buildSelectorMembers, buildNodeSelectMembers, uniqueNames } from './helpers/groupBuilder.js';
import { emitClashRules, sanitizeClashProxyGroups } from './helpers/clashConfigUtils.js';
import { normalizeGroupName, findGroupIndexByName } from './helpers/groupNameUtils.js';
import { IR_VERSION, normalizeLegacyProxyToIR } from '../ir/index.js';
import { mapIRToClashProxy } from '../ir/maps/clash.js';

export class ClashConfigBuilder extends BaseConfigBuilder {
    usesIR = true;

    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry = false, enableClashUI = false, externalController, externalUiDownloadUrl) {
        if (!baseConfig) {
            baseConfig = CLASH_CONFIG;
        }
        super(inputString, baseConfig, lang, userAgent, groupByCountry);
        this.selectedRules = selectedRules;
        this.customRules = customRules;
        this.countryGroupNames = [];
        this.manualGroupName = null;
        this.enableClashUI = enableClashUI;
        this.externalController = externalController;
        this.externalUiDownloadUrl = externalUiDownloadUrl;
    }

    /**
     * Check if subscription format is compatible for use as Clash proxy-provider
     * @param {'clash'|'singbox'|'unknown'} format - Detected subscription format
     * @returns {boolean} - True if format is Clash YAML
     */
    isCompatibleProviderFormat(format) {
        return format === 'clash';
    }

    /**
     * Generate proxy-providers configuration from collected URLs
     * @returns {object} - proxy-providers object
     */
    generateProxyProviders() {
        const providers = {};
        this.providerUrls.forEach((url, index) => {
            const name = `_auto_provider_${index + 1}`;
            providers[name] = {
                type: 'http',
                url: url,
                path: `./proxy_providers/${name}.yaml`,
                interval: 3600,
                'health-check': {
                    enable: true,
                    url: 'https://www.gstatic.com/generate_204',
                    interval: 300,
                    timeout: 5000,
                    lazy: true
                }
            };
        });
        return providers;
    }

    /**
     * Get list of provider names
     * @returns {string[]} - Array of provider names
     */
    getProviderNames() {
        return this.providerUrls.map((_, index) => `_auto_provider_${index + 1}`);
    }

    /**
     * Get all provider names (user-defined + auto-generated)
     * @returns {string[]} - Array of provider names
     */
    getAllProviderNames() {
        const existingProviders = this.config?.['proxy-providers'] && typeof this.config['proxy-providers'] === 'object'
            ? Object.keys(this.config['proxy-providers'])
            : [];
        const autoProviders = this.getProviderNames();
        return [...new Set([...existingProviders, ...autoProviders])];
    }

    getProxies() {
        return this.config.proxies || [];
    }

    getProxyName(proxy) {
        return proxy.name;
    }

    convertProxy(proxy) {
        const ir = proxy?.version === IR_VERSION ? proxy : normalizeLegacyProxyToIR(proxy);
        if (!ir) return null;
        return mapIRToClashProxy(ir);
    }

    addProxyToConfig(proxy) {
        this.config.proxies = this.config.proxies || [];
        addProxyWithDedup(this.config.proxies, proxy, {
            getName: (item) => item?.name,
            setName: (item, name) => {
                if (item) item.name = name;
            },
            isSame: (a = {}, b = {}) => {
                const { name: _name, ...restOfProxy } = b;
                const { name: __name, ...restOfExisting } = a;
                return JSON.stringify(restOfProxy) === JSON.stringify(restOfExisting);
            }
        });
    }

    hasProxyGroup(name) {
        const target = normalizeGroupName(name);
        return (this.config['proxy-groups'] || []).some(group => group && normalizeGroupName(group.name) === target);
    }

    addAutoSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        const autoName = this.t('outboundNames.Auto Select');
        if (this.hasProxyGroup(autoName)) return;

        const group = {
            name: autoName,
            type: 'url-test',
            proxies: deepCopy(uniqueNames(proxyList)),
            url: 'https://www.gstatic.com/generate_204',
            interval: 300,
            lazy: false
        };

        // Add 'use' field if we have proxy-providers
        const providerNames = this.getAllProviderNames();
        if (providerNames.length > 0) {
            group.use = providerNames;
        }

        this.config['proxy-groups'].push(group);
    }

    addNodeSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        const nodeName = this.t('outboundNames.Node Select');
        if (this.hasProxyGroup(nodeName)) return;
        const list = buildNodeSelectMembers({
            proxyList,
            translator: this.t,
            groupByCountry: this.groupByCountry,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames
        });

        const group = {
            type: "select",
            name: nodeName,
            proxies: list
        };

        // Add 'use' field if we have proxy-providers
        const providerNames = this.getAllProviderNames();
        if (providerNames.length > 0) {
            group.use = providerNames;
        }

        this.config['proxy-groups'].unshift(group);
    }

    buildSelectGroupMembers(proxyList = []) {
        return buildSelectorMembers({
            proxyList,
            translator: this.t,
            groupByCountry: this.groupByCountry,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames
        });
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound !== this.t('outboundNames.Node Select')) {
                const name = this.t(`outboundNames.${outbound}`);
                if (!this.hasProxyGroup(name)) {
                    const proxies = this.buildSelectGroupMembers(proxyList);
                    this.config['proxy-groups'].push({
                        type: "select",
                        name,
                        proxies
                    });
                }
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                const name = this.t(`outboundNames.${rule.name}`);
                if (!this.hasProxyGroup(name)) {
                    const proxies = this.buildSelectGroupMembers(proxyList);
                    this.config['proxy-groups'].push({
                        type: "select",
                        name,
                        proxies
                    });
                }
            });
        }
    }

    addFallBackGroup(proxyList) {
        const name = this.t('outboundNames.Fall Back');
        if (this.hasProxyGroup(name)) return;
        const proxies = this.buildSelectGroupMembers(proxyList);
        this.config['proxy-groups'].push({
            type: "select",
            name,
            proxies
        });
    }

    addCountryGroups() {
        const proxies = this.getProxies();
        const countryGroups = groupProxiesByCountry(proxies, {
            getName: proxy => this.getProxyName(proxy)
        });

        const existingNames = new Set((this.config['proxy-groups'] || []).map(g => normalizeGroupName(g?.name)).filter(Boolean));

        const manualProxyNames = proxies.map(p => p?.name).filter(Boolean);
        const manualGroupName = manualProxyNames.length > 0 ? this.t('outboundNames.Manual Switch') : null;
        if (manualGroupName) {
            const manualNorm = normalizeGroupName(manualGroupName);
            if (!existingNames.has(manualNorm)) {
                this.config['proxy-groups'].push({
                    name: manualGroupName,
                    type: 'select',
                    proxies: manualProxyNames
                });
                existingNames.add(manualNorm);
            }
        }

        const countries = Object.keys(countryGroups).sort((a, b) => a.localeCompare(b));
        const countryGroupNames = [];

        countries.forEach(country => {
            const { emoji, name, proxies } = countryGroups[country];
            const groupName = `${emoji} ${name}`;
            const norm = normalizeGroupName(groupName);
            if (!existingNames.has(norm)) {
                this.config['proxy-groups'].push({
                    name: groupName,
                    type: 'url-test',
                    proxies: proxies,
                    url: 'https://www.gstatic.com/generate_204',
                    interval: 300,
                    lazy: false
                });
                existingNames.add(norm);
            }
            countryGroupNames.push(groupName);
        });

        const nodeSelectGroup = this.config['proxy-groups'].find(g => g && g.name === this.t('outboundNames.Node Select'));
        if (nodeSelectGroup && Array.isArray(nodeSelectGroup.proxies)) {
            const rebuilt = buildNodeSelectMembers({
                proxyList: [],
                translator: this.t,
                groupByCountry: true,
                manualGroupName,
                countryGroupNames
            });
            nodeSelectGroup.proxies = rebuilt;
        }
        this.countryGroupNames = countryGroupNames;
        this.manualGroupName = manualGroupName;
    }

    /**
     * Merge user-defined proxy groups with system-generated ones
     * Handles same-name groups by merging proxies/use fields and preserving user settings
     * @param {Array} userGroups - User-defined proxy groups from input config
     */
    mergeUserProxyGroups(userGroups) {
        if (!Array.isArray(userGroups)) return;

        const proxyList = this.getProxyList();
        const allProviderNames = new Set(this.getAllProviderNames());

        // Build valid reference set (proxies, groups, special names)
        const groupNames = new Set(
            (this.config['proxy-groups'] || [])
                .map(g => normalizeGroupName(g?.name))
                .filter(Boolean)
        );
        const validRefs = new Set(['DIRECT', 'REJECT']);
        proxyList.forEach(n => validRefs.add(n));
        groupNames.forEach(n => validRefs.add(n));

        userGroups.forEach(userGroup => {
            if (!userGroup?.name) return;

            const existingIndex = findGroupIndexByName(
                this.config['proxy-groups'],
                userGroup.name
            );

            if (existingIndex >= 0) {
                // Merge with existing system group
                const existing = this.config['proxy-groups'][existingIndex];

                // Merge 'use' field (provider references)
                if (Array.isArray(userGroup.use) && userGroup.use.length > 0) {
                    const validUserProviders = userGroup.use.filter(p => allProviderNames.has(p));
                    existing.use = [...new Set([
                        ...(existing.use || []),
                        ...validUserProviders
                    ])];
                }

                // Merge 'proxies' field - validate references first
                if (Array.isArray(userGroup.proxies)) {
                    const validUserProxies = userGroup.proxies.filter(p => validRefs.has(p));
                    existing.proxies = [...new Set([
                        ...(existing.proxies || []),
                        ...validUserProxies
                    ])];
                }

                // Preserve user's custom settings (url, interval)
                if (userGroup.url) existing.url = userGroup.url;
                if (typeof userGroup.interval === 'number') existing.interval = userGroup.interval;
                if (typeof userGroup.lazy === 'boolean') existing.lazy = userGroup.lazy;
            } else {
                // New user-defined group - validate and add
                const newGroup = { ...userGroup };

                // Validate proxies references
                if (Array.isArray(newGroup.proxies)) {
                    newGroup.proxies = newGroup.proxies.filter(p => validRefs.has(p));
                }

                // Validate use (provider) references
                if (Array.isArray(newGroup.use)) {
                    newGroup.use = newGroup.use.filter(p => allProviderNames.has(p));
                }

                // Add group if:
                // 1. Has valid proxies or use, OR
                // 2. Is url-test/fallback type (will be filled by validateProxyGroups)
                const isAutoFillableType = newGroup.type === 'url-test' || newGroup.type === 'fallback';
                if ((newGroup.proxies?.length > 0) || (newGroup.use?.length > 0) || isAutoFillableType) {
                    this.config['proxy-groups'].push(newGroup);
                }
            }
        });
    }

    /**
     * Validate proxy groups before final output
     * Ensures url-test/fallback groups have proxies, fills empty ones with all nodes
     */
    validateProxyGroups() {
        const proxyList = this.getProxyList();
        const providerNames = this.getAllProviderNames();

        (this.config['proxy-groups'] || []).forEach(group => {
            // For url-test/fallback groups, ensure they have proxies or providers
            if ((group.type === 'url-test' || group.type === 'fallback') &&
                (!group.proxies || group.proxies.length === 0) &&
                (!group.use || group.use.length === 0)) {
                // Fill with all available proxies
                group.proxies = [...proxyList];
                // Also use all providers if available
                if (providerNames.length > 0) {
                    group.use = [...providerNames];
                }
            }
        });
    }

    // 生成规则
    generateRules() {
        return generateRules(this.selectedRules, this.customRules);
    }

    formatConfig() {
        const rules = this.generateRules();
        const { site_rule_providers, ip_rule_providers } = generateClashRuleSets(this.selectedRules, this.customRules);
        this.config['rule-providers'] = {
            ...site_rule_providers,
            ...ip_rule_providers
        };
        const ruleResults = emitClashRules(rules, this.t);

        // Add proxy-providers if we have any
        if (this.providerUrls.length > 0) {
            this.config['proxy-providers'] = {
                ...this.config['proxy-providers'],
                ...this.generateProxyProviders()
            };
        }

        // Validate proxy groups: fill empty url-test/fallback groups with all proxies
        this.validateProxyGroups();

        sanitizeClashProxyGroups(this.config);

        this.config.rules = [
            ...ruleResults,
            `MATCH,${this.t('outboundNames.Fall Back')}`
        ];

        // Enable Clash UI (external controller/dashboard) when requested or when custom UI params are provided
        if (this.enableClashUI || this.externalController || this.externalUiDownloadUrl) {
            const defaultController = '0.0.0.0:9090';
            const defaultUiPath = './ui';
            const defaultUiName = 'zashboard';
            const defaultUiUrl = 'https://gh-proxy.com/https://github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip';
            const defaultSecret = '';

            const controller = this.externalController || this.config['external-controller'] || defaultController;
            const uiPath = this.config['external-ui'] || defaultUiPath;
            const uiName = this.config['external-ui-name'] || defaultUiName;
            const uiUrl = this.externalUiDownloadUrl || this.config['external-ui-url'] || defaultUiUrl;
            const secret = this.config['secret'] ?? defaultSecret;

            this.config['external-controller'] = controller;
            this.config['external-ui'] = uiPath;
            this.config['external-ui-name'] = uiName;
            this.config['external-ui-url'] = uiUrl;
            this.config['secret'] = secret;
        }

        return yaml.dump(this.config);
    }
}
