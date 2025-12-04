import yaml from 'js-yaml';
import { CLASH_CONFIG, generateRules, generateClashRuleSets, getOutbounds, PREDEFINED_RULE_SETS } from '../config/index.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { deepCopy, groupProxiesByCountry } from '../utils.js';
import { addProxyWithDedup } from './helpers/proxyHelpers.js';
import { buildSelectorMembers, buildNodeSelectMembers, uniqueNames } from './helpers/groupBuilder.js';
import { emitClashRules, sanitizeClashProxyGroups } from './helpers/clashConfigUtils.js';

export class ClashConfigBuilder extends BaseConfigBuilder {
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

    getProxies() {
        return this.config.proxies || [];
    }

    getProxyName(proxy) {
        return proxy.name;
    }

    convertProxy(proxy) {
        switch (proxy.type) {
            case 'shadowsocks':
                return {
                    name: proxy.tag,
                    type: 'ss',
                    server: proxy.server,
                    port: proxy.server_port,
                    cipher: proxy.method,
                    password: proxy.password
                };
            case 'vmess':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    uuid: proxy.uuid,
                    alterId: proxy.alter_id ?? 0,
                    cipher: proxy.security,
                    tls: proxy.tls?.enabled || false,
                    servername: proxy.tls?.server_name || '',
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    network: proxy.transport?.type || proxy.network || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws'
                        ? {
                            path: proxy.transport.path,
                            headers: proxy.transport.headers
                        }
                        : undefined,
                    'http-opts': proxy.transport?.type === 'http'
                        ? (() => {
                            const opts = {
                                method: proxy.transport.method || 'GET',
                                path: Array.isArray(proxy.transport.path) ? proxy.transport.path : [proxy.transport.path || '/'],
                            };
                            if (proxy.transport.headers && Object.keys(proxy.transport.headers).length > 0) {
                                opts.headers = proxy.transport.headers;
                            }
                            return opts;
                        })()
                        : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc'
                        ? {
                            'grpc-service-name': proxy.transport.service_name
                        }
                        : undefined,
                    'h2-opts': proxy.transport?.type === 'h2'
                        ? {
                            path: proxy.transport.path,
                            host: proxy.transport.host
                        }
                        : undefined
                };
            case 'vless':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    uuid: proxy.uuid,
                    cipher: proxy.security,
                    tls: proxy.tls?.enabled || false,
                    'client-fingerprint': proxy.tls?.utls?.fingerprint,
                    servername: proxy.tls?.server_name || '',
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    } : undefined,
                    'reality-opts': proxy.tls?.reality?.enabled ? {
                        'public-key': proxy.tls.reality.public_key,
                        'short-id': proxy.tls.reality.short_id,
                    } : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc' ? {
                        'grpc-service-name': proxy.transport.service_name,
                    } : undefined,
                    tfo: proxy.tcp_fast_open,
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(typeof proxy.udp !== 'undefined' ? { udp: proxy.udp } : {}),
                    ...(proxy.alpn ? { alpn: proxy.alpn } : {}),
                    ...(proxy.packet_encoding ? { 'packet-encoding': proxy.packet_encoding } : {}),
                    'flow': proxy.flow ?? undefined,
                };
            case 'hysteria2':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    ...(proxy.ports ? { ports: proxy.ports } : {}),
                    obfs: proxy.obfs?.type,
                    'obfs-password': proxy.obfs?.password,
                    password: proxy.password,
                    auth: proxy.auth,
                    up: proxy.up,
                    down: proxy.down,
                    'recv-window-conn': proxy.recv_window_conn,
                    sni: proxy.tls?.server_name || '',
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(proxy.hop_interval !== undefined ? { 'hop-interval': proxy.hop_interval } : {}),
                    ...(proxy.alpn ? { alpn: proxy.alpn } : {}),
                    ...(proxy.fast_open !== undefined ? { 'fast-open': proxy.fast_open } : {}),
                };
            case 'trojan':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    password: proxy.password,
                    cipher: proxy.security,
                    tls: proxy.tls?.enabled || false,
                    'client-fingerprint': proxy.tls?.utls?.fingerprint,
                    sni: proxy.tls?.server_name || '',
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    } : undefined,
                    'reality-opts': proxy.tls?.reality?.enabled ? {
                        'public-key': proxy.tls.reality.public_key,
                        'short-id': proxy.tls.reality.short_id,
                    } : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc' ? {
                        'grpc-service-name': proxy.transport.service_name,
                    } : undefined,
                    tfo: proxy.tcp_fast_open,
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(proxy.alpn ? { alpn: proxy.alpn } : {}),
                    'flow': proxy.flow ?? undefined,
                };
            case 'tuic':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    uuid: proxy.uuid,
                    password: proxy.password,
                    'congestion-controller': proxy.congestion_control,
                    'skip-cert-verify': !!proxy.tls?.insecure,
                    ...(proxy.disable_sni !== undefined ? { 'disable-sni': proxy.disable_sni } : {}),
                    ...(proxy.tls?.alpn ? { alpn: proxy.tls.alpn } : {}),
                    'sni': proxy.tls?.server_name,
                    'udp-relay-mode': proxy.udp_relay_mode || 'native',
                    ...(proxy.zero_rtt !== undefined ? { 'zero-rtt': proxy.zero_rtt } : {}),
                    ...(proxy.reduce_rtt !== undefined ? { 'reduce-rtt': proxy.reduce_rtt } : {}),
                    ...(proxy.fast_open !== undefined ? { 'fast-open': proxy.fast_open } : {}),
                };
            case 'anytls':
                return {
                    name: proxy.tag,
                    type: 'anytls',
                    server: proxy.server,
                    port: proxy.server_port,
                    password: proxy.password,
                    ...(proxy.udp !== undefined ? { udp: proxy.udp } : {}),
                    ...(proxy.tls?.utls?.fingerprint ? { 'client-fingerprint': proxy.tls.utls.fingerprint } : {}),
                    ...(proxy.tls?.server_name ? { sni: proxy.tls.server_name } : {}),
                    ...(proxy.tls?.insecure !== undefined ? { 'skip-cert-verify': !!proxy.tls.insecure } : {}),
                    ...(proxy.tls?.alpn ? { alpn: proxy.tls.alpn } : {}),
                    ...(proxy['idle-session-check-interval'] !== undefined ? { 'idle-session-check-interval': proxy['idle-session-check-interval'] } : {}),
                    ...(proxy['idle-session-timeout'] !== undefined ? { 'idle-session-timeout': proxy['idle-session-timeout'] } : {}),
                    ...(proxy['min-idle-session'] !== undefined ? { 'min-idle-session': proxy['min-idle-session'] } : {}),
                };
            default:
                return proxy; // Return as-is if no specific conversion is defined
        }
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
        const normalize = (s) => typeof s === 'string' ? s.trim() : s;
        const target = normalize(name);
        return (this.config['proxy-groups'] || []).some(group => group && normalize(group.name) === target);
    }

    addAutoSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        const autoName = this.t('outboundNames.Auto Select');
        if (this.hasProxyGroup(autoName)) return;
        this.config['proxy-groups'].push({
            name: autoName,
            type: 'url-test',
            proxies: deepCopy(uniqueNames(proxyList)),
            url: 'https://www.gstatic.com/generate_204',
            interval: 300,
            lazy: false
        });
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
        this.config['proxy-groups'].unshift({
            type: "select",
            name: nodeName,
            proxies: list
        });
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

        const normalize = (s) => typeof s === 'string' ? s.trim() : s;
        const existingNames = new Set((this.config['proxy-groups'] || []).map(g => normalize(g?.name)).filter(Boolean));

        const manualProxyNames = proxies.map(p => p?.name).filter(Boolean);
        const manualGroupName = manualProxyNames.length > 0 ? this.t('outboundNames.Manual Switch') : null;
        if (manualGroupName) {
            const manualNorm = normalize(manualGroupName);
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
            const norm = normalize(groupName);
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
