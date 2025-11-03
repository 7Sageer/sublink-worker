import { ProxyParser, convertYamlProxyToObject } from './ProxyParsers.js';
import { DeepCopy, tryDecodeSubscriptionLines, decodeBase64 } from './utils.js';
import yaml from 'js-yaml';
import { t, setLanguage } from './i18n/index.js';
import { generateRules, getOutbounds, PREDEFINED_RULE_SETS } from './config.js';

export class BaseConfigBuilder {
    constructor(inputString, baseConfig, lang, userAgent) {
        this.inputString = inputString;
        this.config = DeepCopy(baseConfig);
        this.customRules = [];
        this.selectedRules = [];
        setLanguage(lang);
        this.userAgent = userAgent;
        this.appliedOverrideKeys = new Set();
    }

    async build() {
        const customItems = await this.parseCustomItems();
        this.addCustomItems(customItems);
        this.addSelectors();
        return this.formatConfig();
    }

    async parseCustomItems() {
        const input = this.inputString || '';
        const parsedItems = [];

        // Quick heuristic: if looks like plain YAML text (and not URLs), try YAML first without decoding
        const looksLikeYaml = /\bproxies\s*:/i.test(input) && /\btype\s*:/i.test(input);
        if (looksLikeYaml) {
            try {
                const obj = yaml.load(input.trim());
                if (obj && typeof obj === 'object' && Array.isArray(obj.proxies)) {
                    const overrides = DeepCopy(obj);
                    delete overrides.proxies;
                    if (Object.keys(overrides).length > 0) {
                        this.applyConfigOverrides(overrides);
                    }
                    for (const p of obj.proxies) {
                        const proxy = convertYamlProxyToObject(p);
                        if (proxy) parsedItems.push(proxy);
                    }
                    if (parsedItems.length > 0) return parsedItems;
                }
            } catch (e) {
                console.warn('YAML parse failed in builder (heuristic path):', e?.message || e);
            }
        }

        // If not clear YAML, only try whole-document decode if input looks base64-like
        const isBase64Like = /^[A-Za-z0-9+/=\r\n]+$/.test(input) && input.replace(/[\r\n]/g, '').length % 4 === 0;
        if (!looksLikeYaml && isBase64Like) {
            try {
                const sanitized = input.replace(/\s+/g, '');
                const decodedWhole = decodeBase64(sanitized);
                if (typeof decodedWhole === 'string') {
                    const maybeYaml = decodedWhole.trim();
                    try {
                        const obj = yaml.load(maybeYaml);
                        if (obj && typeof obj === 'object' && Array.isArray(obj.proxies)) {
                            const overrides = DeepCopy(obj);
                            delete overrides.proxies;
                            if (Object.keys(overrides).length > 0) {
                                this.applyConfigOverrides(overrides);
                            }
                            for (const p of obj.proxies) {
                                const proxy = convertYamlProxyToObject(p);
                                if (proxy) parsedItems.push(proxy);
                            }
                            if (parsedItems.length > 0) return parsedItems;
                        }
                    } catch (e) {
                        // not YAML; fall through
                    }
                }
            } catch (_) {}
        }

        // Otherwise, line-by-line processing (URLs, subscription content, remote lists, etc.)
        const urls = input.split('\n').filter(url => url.trim() !== '');
        for (const url of urls) {
            let processedUrls = tryDecodeSubscriptionLines(url);
            if (!Array.isArray(processedUrls)) {
                processedUrls = [processedUrls];
            }

            for (const processedUrl of processedUrls) {
                const result = await ProxyParser.parse(processedUrl, this.userAgent);
                if (result && typeof result === 'object' && result.type === 'yamlConfig') {
                    if (result.config) {
                        this.applyConfigOverrides(result.config);
                    }
                    if (Array.isArray(result.proxies)) {
                        result.proxies.forEach(proxy => {
                            if (proxy && typeof proxy === 'object' && proxy.tag) {
                                parsedItems.push(proxy);
                            }
                        });
                    }
                    continue;
                }
                if (Array.isArray(result)) {
                    for (const item of result) {
                        if (item && typeof item === 'object' && item.tag) {
                            parsedItems.push(item);
                        } else if (typeof item === 'string') {
                            const subResult = await ProxyParser.parse(item, this.userAgent);
                            if (subResult) {
                                parsedItems.push(subResult);
                            }
                        }
                    }
                } else if (result) {
                    parsedItems.push(result);
                }
            }
        }

        return parsedItems;
    }

    applyConfigOverrides(overrides) {
        if (!overrides || typeof overrides !== 'object') {
            return;
        }

        const blacklistedKeys = new Set(['proxies', 'proxy-groups', 'rules', 'rule-providers']);

        Object.entries(overrides).forEach(([key, value]) => {
            if (blacklistedKeys.has(key)) {
                return;
            }
            if (value === undefined) {
                delete this.config[key];
                this.appliedOverrideKeys.add(key);
            } else {
                this.config[key] = DeepCopy(value);
                this.appliedOverrideKeys.add(key);
            }
        });
    }

    hasConfigOverride(key) {
        return this.appliedOverrideKeys?.has(key);
    }

    getOutboundsList() {
        let outbounds;
        if (typeof this.selectedRules === 'string' && PREDEFINED_RULE_SETS[this.selectedRules]) {
            outbounds = getOutbounds(PREDEFINED_RULE_SETS[this.selectedRules]);
        } else if (this.selectedRules && Object.keys(this.selectedRules).length > 0) {
            outbounds = getOutbounds(this.selectedRules);
        } else {
            outbounds = getOutbounds(PREDEFINED_RULE_SETS.minimal);
        }
        return outbounds;
    }

    getProxyList() {
        return this.getProxies().map(proxy => this.getProxyName(proxy));
    }

    getProxies() {
        throw new Error('getProxies must be implemented in child class');
    }

    getProxyName(proxy) {
        throw new Error('getProxyName must be implemented in child class');
    }

    convertProxy(proxy) {
        throw new Error('convertProxy must be implemented in child class');
    }

    addProxyToConfig(proxy) {
        throw new Error('addProxyToConfig must be implemented in child class');
    }

    addAutoSelectGroup(proxyList) {
        throw new Error('addAutoSelectGroup must be implemented in child class');
    }

    addNodeSelectGroup(proxyList) {
        throw new Error('addNodeSelectGroup must be implemented in child class');
    }

    addOutboundGroups(outbounds, proxyList) {
        throw new Error('addOutboundGroups must be implemented in child class');
    }

    addCustomRuleGroups(proxyList) {
        throw new Error('addCustomRuleGroups must be implemented in child class');
    }

    addFallBackGroup(proxyList) {
        throw new Error('addFallBackGroup must be implemented in child class');
    }

    addCustomItems(customItems) {
        const validItems = customItems.filter(item => item != null);
        validItems.forEach(item => {
            if (item?.tag) {
                const convertedProxy = this.convertProxy(item);
                if (convertedProxy) {
                    this.addProxyToConfig(convertedProxy);
                }
            }
        });
    }

    addSelectors() {
        const outbounds = this.getOutboundsList();
        const proxyList = this.getProxyList();

        this.addAutoSelectGroup(proxyList);
        this.addNodeSelectGroup(proxyList);
        this.addOutboundGroups(outbounds, proxyList);
        this.addCustomRuleGroups(proxyList);
        this.addFallBackGroup(proxyList);
    }

    generateRules() {
        return generateRules(this.selectedRules, this.customRules);
    }

    formatConfig() {
        throw new Error('formatConfig must be implemented in child class');
    }
}
