
import { SING_BOX_CONFIG, generateRuleSets, generateRules, getOutbounds, PREDEFINED_RULE_SETS } from '../config/index.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { deepCopy, groupProxiesByCountry } from '../utils.js';
import { addProxyWithDedup } from './helpers/proxyHelpers.js';
import { buildSelectorMembers as buildSelectorMemberList, buildNodeSelectMembers, uniqueNames } from './helpers/groupBuilder.js';

export class SingboxConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent, groupByCountry = false, enableClashUI = false, externalController, externalUiDownloadUrl, singboxVersion = '1.12') {
        const resolvedBaseConfig = baseConfig ?? SING_BOX_CONFIG;
        super(inputString, resolvedBaseConfig, lang, userAgent, groupByCountry);

        this.selectedRules = selectedRules;
        this.customRules = customRules;
        this.countryGroupNames = [];
        this.manualGroupName = null;
        this.enableClashUI = enableClashUI;
        this.externalController = externalController;
        this.externalUiDownloadUrl = externalUiDownloadUrl;
        this.singboxVersion = singboxVersion;  // '1.11' or '1.12'

        if (this.config?.dns?.servers?.length > 0) {
            this.config.dns.servers[0].detour = this.t('outboundNames.Node Select');
        }
    }

    /**
     * Check if subscription format is compatible for use as Sing-Box outbound_provider
     * Only available in Sing-Box 1.12+
     * @param {'clash'|'singbox'|'unknown'} format - Detected subscription format
     * @returns {boolean} - True if format is Sing-Box JSON and version supports providers
     */
    isCompatibleProviderFormat(format) {
        // outbound_providers only supported in Sing-Box 1.12+
        if (this.singboxVersion === '1.11') {
            return false;
        }
        return format === 'singbox';
    }

    /**
     * Generate outbound_providers configuration from collected URLs
     * @returns {object[]} - Array of outbound provider objects
     */
    generateOutboundProviders() {
        return this.providerUrls.map((url, index) => ({
            tag: `provider${index + 1}`,
            type: 'http',
            download_url: url,
            path: `./providers/provider${index + 1}.json`,
            download_interval: '24h',
            health_check: {
                enabled: true,
                url: 'https://www.gstatic.com/generate_204',
                interval: '5m'
            }
        }));
    }

    /**
     * Get list of provider tags
     * @returns {string[]} - Array of provider tags
     */
    getProviderTags() {
        return this.providerUrls.map((_, index) => `provider${index + 1}`);
    }

    getProxies() {
        return this.config.outbounds.filter(outbound => outbound?.server != undefined);
    }

    getProxyName(proxy) {
        return proxy.tag;
    }

    convertProxy(proxy) {
        // Create a shallow copy to avoid mutating the original
        const sanitized = { ...proxy };

        // Remove Clash-specific fields that are not valid in sing-box outbound configuration
        // In sing-box, UDP is controlled by 'network' field (defaults to both tcp and udp)
        // The 'udp: true/false' field is a Clash/Clash Meta specific setting
        delete sanitized.udp;

        // Remove 'alpn' from root level - it should only exist inside 'tls' object for sing-box
        // For protocols like vless/vmess, alpn belongs inside the tls configuration
        if (sanitized.alpn && sanitized.tls) {
            // Move alpn into tls if tls exists and doesn't have alpn
            if (!sanitized.tls.alpn) {
                sanitized.tls = { ...sanitized.tls, alpn: sanitized.alpn };
            }
            delete sanitized.alpn;
        } else if (sanitized.alpn && !sanitized.tls) {
            // No TLS, remove alpn entirely
            delete sanitized.alpn;
        }

        // Remove packet_encoding for now - it's version-specific in sing-box
        // xudp is default in newer versions
        delete sanitized.packet_encoding;

        return sanitized;
    }

    addProxyToConfig(proxy) {
        this.config.outbounds = this.config.outbounds || [];
        addProxyWithDedup(this.config.outbounds, proxy, {
            getName: (item) => item?.tag,
            setName: (item, name) => {
                if (item) item.tag = name;
            },
            isSame: (existing = {}, incoming = {}) => {
                const { tag: _incomingTag, ...restIncoming } = incoming;
                const { tag: _existingTag, ...restExisting } = existing;
                return JSON.stringify(restIncoming) === JSON.stringify(restExisting);
            }
        });
    }

    hasOutboundTag(tag) {
        const normalize = (s) => typeof s === 'string' ? s.trim() : s;
        const target = normalize(tag);
        return (this.config.outbounds || []).some(outbound => normalize(outbound?.tag) === target);
    }

    addAutoSelectGroup(proxyList) {
        this.config.outbounds = this.config.outbounds || [];
        const tag = this.t('outboundNames.Auto Select');
        if (this.hasOutboundTag(tag)) return;

        const group = {
            type: "urltest",
            tag,
            outbounds: deepCopy(uniqueNames(proxyList))
        };

        // Add 'providers' field if we have outbound_providers
        const providerTags = this.getProviderTags();
        if (providerTags.length > 0) {
            group.providers = providerTags;
        }

        this.config.outbounds.unshift(group);
    }

    addNodeSelectGroup(proxyList) {
        this.config.outbounds = this.config.outbounds || [];
        const tag = this.t('outboundNames.Node Select');
        if (this.hasOutboundTag(tag)) return;
        const members = buildNodeSelectMembers({
            proxyList,
            translator: this.t,
            groupByCountry: this.groupByCountry,
            manualGroupName: this.manualGroupName,
            countryGroupNames: this.countryGroupNames
        });

        const group = {
            type: "selector",
            tag,
            outbounds: members
        };

        // Add 'providers' field if we have outbound_providers
        const providerTags = this.getProviderTags();
        if (providerTags.length > 0) {
            group.providers = providerTags;
        }

        this.config.outbounds.unshift(group);
    }

    buildSelectorMembers(proxyList = []) {
        return buildSelectorMemberList({
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
                const selectorMembers = this.buildSelectorMembers(proxyList);
                const tag = this.t(`outboundNames.${outbound}`);
                if (this.hasOutboundTag(tag)) {
                    return;
                }
                this.config.outbounds.push({
                    type: "selector",
                    tag,
                    outbounds: selectorMembers
                });
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                const selectorMembers = this.buildSelectorMembers(proxyList);
                if (this.hasOutboundTag(rule.name)) return;
                this.config.outbounds.push({
                    type: "selector",
                    tag: rule.name,
                    outbounds: selectorMembers
                });
            });
        }
    }

    addFallBackGroup(proxyList) {
        const selectorMembers = this.buildSelectorMembers(proxyList);
        if (this.hasOutboundTag(this.t('outboundNames.Fall Back'))) return;
        this.config.outbounds.push({
            type: "selector",
            tag: this.t('outboundNames.Fall Back'),
            outbounds: selectorMembers
        });
    }

    addCountryGroups() {
        const proxies = this.getProxies();
        const countryGroups = groupProxiesByCountry(proxies, {
            getName: proxy => this.getProxyName(proxy)
        });

        const normalize = (s) => typeof s === 'string' ? s.trim() : s;
        const existingTags = new Set((this.config.outbounds || []).map(o => normalize(o?.tag)).filter(Boolean));

        const manualProxyNames = proxies.map(p => p?.tag).filter(Boolean);
        const manualGroupName = manualProxyNames.length > 0 ? this.t('outboundNames.Manual Switch') : null;
        if (manualGroupName) {
            const manualNorm = normalize(manualGroupName);
            if (!existingTags.has(manualNorm)) {
                this.config.outbounds.push({
                    type: 'selector',
                    tag: manualGroupName,
                    outbounds: manualProxyNames
                });
                existingTags.add(manualNorm);
            }
        }

        const countries = Object.keys(countryGroups).sort((a, b) => a.localeCompare(b));
        const countryGroupNames = [];

        countries.forEach(country => {
            const { emoji, name, proxies: countryProxies } = countryGroups[country];
            if (!countryProxies || countryProxies.length === 0) {
                return;
            }
            const groupName = `${emoji} ${name}`;
            const norm = normalize(groupName);
            if (!existingTags.has(norm)) {
                this.config.outbounds.push({
                    tag: groupName,
                    type: 'urltest',
                    outbounds: countryProxies
                });
                existingTags.add(norm);
            }
            countryGroupNames.push(groupName);
        });

        const nodeSelectTag = this.t('outboundNames.Node Select');
        const nodeSelectGroup = this.config.outbounds.find(o => normalize(o?.tag) === normalize(nodeSelectTag));
        if (nodeSelectGroup && Array.isArray(nodeSelectGroup.outbounds)) {
            const rebuilt = buildNodeSelectMembers({
                proxyList: [],
                translator: this.t,
                groupByCountry: true,
                manualGroupName,
                countryGroupNames
            });
            nodeSelectGroup.outbounds = rebuilt;
        }

        this.countryGroupNames = countryGroupNames;
        this.manualGroupName = manualGroupName;
    }

    formatConfig() {
        const rules = generateRules(this.selectedRules, this.customRules);
        const { site_rule_sets, ip_rule_sets } = generateRuleSets(this.selectedRules, this.customRules);

        this.config.route.rule_set = [...site_rule_sets, ...ip_rule_sets];

        // Add outbound_providers if we have any
        if (this.providerUrls.length > 0) {
            this.config.outbound_providers = this.generateOutboundProviders();
        }

        rules.filter(rule => !!rule.domain_suffix || !!rule.domain_keyword).map(rule => {
            this.config.route.rules.push({
                domain_suffix: rule.domain_suffix,
                domain_keyword: rule.domain_keyword,
                protocol: rule.protocol,
                outbound: this.t(`outboundNames.${rule.outbound}`)
            });
        });

        rules.filter(rule => !!rule.site_rules[0]).map(rule => {
            this.config.route.rules.push({
                rule_set: [
                    ...(rule.site_rules.length > 0 && rule.site_rules[0] !== '' ? rule.site_rules : []),
                ],
                protocol: rule.protocol,
                outbound: this.t(`outboundNames.${rule.outbound}`)
            });
        });

        rules.filter(rule => !!rule.ip_rules[0]).map(rule => {
            this.config.route.rules.push({
                rule_set: [
                    ...(rule.ip_rules
                        .map(ip => ip.trim())
                        .filter(ip => ip !== '')
                        .map(ip => `${ip}-ip`))
                ],
                protocol: rule.protocol,
                outbound: this.t(`outboundNames.${rule.outbound}`)
            });
        });

        rules.filter(rule => !!rule.ip_cidr).map(rule => {
            this.config.route.rules.push({
                ip_cidr: rule.ip_cidr,
                protocol: rule.protocol,
                outbound: this.t(`outboundNames.${rule.outbound}`)
            });
        });

        this.config.route.rules.unshift(
            { clash_mode: 'direct', outbound: 'DIRECT' },
            { clash_mode: 'global', outbound: this.t('outboundNames.Node Select') },
            { action: 'sniff' },
            { protocol: 'dns', action: 'hijack-dns' }
        );

        this.config.route.auto_detect_interface = true;
        this.config.route.final = this.t('outboundNames.Fall Back');
        // 如果启用了 Clash UI，添加配置
        // 如果启用 Clash UI 或传入了自定义参数，添加/覆盖 Clash API 配置
        if (this.enableClashUI || this.externalController || this.externalUiDownloadUrl) {
            const defaultExternalController = "0.0.0.0:9090";
            const defaultExternalUiDownloadUrl = "https://gh-proxy.com/https://github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip";
            const defaultExternalUi = "./ui";
            const defaultSecret = "";
            const defaultDownloadDetour = "DIRECT";
            const defaultClashMode = "rule";

            this.config.experimental = this.config.experimental || {};
            const existingClashApi = this.config.experimental.clash_api || {};

            const externalController = this.externalController || existingClashApi.external_controller || defaultExternalController;
            const externalUiDownloadUrl = this.externalUiDownloadUrl || existingClashApi.external_ui_download_url || defaultExternalUiDownloadUrl;
            const externalUi = existingClashApi.external_ui || defaultExternalUi;
            const secret = existingClashApi.secret ?? defaultSecret;
            const externalUiDownloadDetour = existingClashApi.external_ui_download_detour || defaultDownloadDetour;
            const clashMode = existingClashApi.default_mode || defaultClashMode;

            this.config.experimental.clash_api = {
                ...existingClashApi,
                external_controller: externalController,
                external_ui: externalUi,
                external_ui_download_url: externalUiDownloadUrl,
                external_ui_download_detour: externalUiDownloadDetour,
                secret,
                default_mode: clashMode
            };
        }
        return this.config;
    }
}
