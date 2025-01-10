import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { generateRules, getOutbounds, PREDEFINED_RULE_SETS } from './config.js';

export class SurgeConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, pin, baseConfig) {
        super(inputString, baseConfig || {
            'general': {
                'allow-wifi-access': false,
                'wifi-access-http-port': 6152,
                'wifi-access-socks5-port': 6153,
                'http-listen': '127.0.0.1:6152',
                'socks5-listen': '127.0.0.1:6153',
                'allow-hotspot-access': false,
                'skip-proxy': '127.0.0.1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,100.64.0.0/10,17.0.0.0/8,localhost,*.local,*.crashlytics.com,seed-sequoia.siri.apple.com,sequoia.apple.com',
                'test-timeout': 5,
                'proxy-test-url': 'http://cp.cloudflare.com/generate_204',
                'internet-test-url': 'http://www.apple.com/library/test/success.html',
                'geoip-maxmind-url': 'https://raw.githubusercontent.com/Loyalsoldier/geoip/release/Country.mmdb',
                'ipv6': false,
                'show-error-page-for-reject': true,
                'dns-server': '119.29.29.29, 180.184.1.1, 223.5.5.5, system',
                'encrypted-dns-server': 'https://223.5.5.5/dns-query',
                'exclude-simple-hostnames': true,
                'read-etc-hosts': true,
                'always-real-ip': '*.msftconnecttest.com, *.msftncsi.com, *.srv.nintendo.net, *.stun.playstation.net, xbox.*.microsoft.com, *.xboxlive.com, *.logon.battlenet.com.cn, *.logon.battle.net, stun.l.google.com, easy-login.10099.com.cn,*-update.xoyocdn.com, *.prod.cloud.netflix.com, appboot.netflix.com, *-appboot.netflix.com',
                'hijack-dns': '*:53',
                'udp-policy-not-supported-behaviour': 'REJECT',
                'hide-vpn-icon': false,
            },
            'replica': {
                'hide-apple-request': true,
                'hide-crashlytics-request': true,
                'use-keyword-filter': false,
                'hide-udp': false
            }
        });
        this.selectedRules = selectedRules;
        this.customRules = customRules;
        this.pin = pin;
        this.subscriptionUrl = null;
    }

    setSubscriptionUrl(url) {
        this.subscriptionUrl = url;
        return this;
    }

    addCustomItems(customItems) {
        customItems.forEach(item => {
            if (item?.tag && !this.config.proxies?.some(p => p.name === item.tag)) {
                this.config.proxies = this.config.proxies || [];
                this.config.proxies.push(this.convertToSurgeProxy(item));
            }
        });
    }

    convertToSurgeProxy(proxy) {
        let surgeProxy;
        switch (proxy.type) {
            case 'shadowsocks':
                surgeProxy = `${proxy.tag} = ss, ${proxy.server}, ${proxy.server_port}, encrypt-method=${proxy.method}, password=${proxy.password}`;
                break;
            case 'vmess':
                surgeProxy = `${proxy.tag} = vmess, ${proxy.server}, ${proxy.server_port}, username=${proxy.uuid}`;
                if (proxy.tls?.enabled) {
                    surgeProxy += ', tls=true';
                    if (proxy.tls.server_name) {
                        surgeProxy += `, sni=${proxy.tls.server_name}`;
                    }
                    if (proxy.tls.insecure) {
                        surgeProxy += ', skip-cert-verify=true';
                    }
                    if (proxy.tls.alpn) {
                        surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                    }
                }
                if (proxy.transport?.type === 'ws') {
                    surgeProxy += `, ws=true, ws-path=${proxy.transport.path}`;
                    if (proxy.transport.headers) {
                        surgeProxy += `, ws-headers=Host:${proxy.transport.headers.Host}`;
                    }
                } else if (proxy.transport?.type === 'grpc') {
                    surgeProxy += `, grpc-service-name=${proxy.transport.service_name}`;
                }
                break;
            case 'trojan':
                surgeProxy = `${proxy.tag} = trojan, ${proxy.server}, ${proxy.server_port}, password=${proxy.password}`;
                if (proxy.tls?.server_name) {
                    surgeProxy += `, sni=${proxy.tls.server_name}`;
                }
                if (proxy.tls?.insecure) {
                    surgeProxy += ', skip-cert-verify=true';
                }
                if (proxy.tls?.alpn) {
                    surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                }
                if (proxy.transport?.type === 'ws') {
                    surgeProxy += `, ws=true, ws-path=${proxy.transport.path}`;
                    if (proxy.transport.headers) {
                        surgeProxy += `, ws-headers=Host:${proxy.transport.headers.Host}`;
                    }
                } else if (proxy.transport?.type === 'grpc') {
                    surgeProxy += `, grpc-service-name=${proxy.transport.service_name}`;
                }
                break;
            case 'hysteria2':
                surgeProxy = `${proxy.tag} = hysteria2, ${proxy.server}, ${proxy.server_port}, password=${proxy.password}`;
                if (proxy.tls?.server_name) {
                    surgeProxy += `, sni=${proxy.tls.server_name}`;
                }
                if (proxy.tls?.insecure) {
                    surgeProxy += ', skip-cert-verify=true';
                }
                if (proxy.tls?.alpn) {
                    surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                }
                break;
            case 'tuic':
                surgeProxy = `${proxy.tag} = tuic, ${proxy.server}, ${proxy.server_port}, password=${proxy.password}, uuid=${proxy.uuid}`;
                if (proxy.tls?.server_name) {
                    surgeProxy += `, sni=${proxy.tls.server_name}`;
                }
                if (proxy.tls?.alpn) {
                    surgeProxy += `, alpn=${proxy.tls.alpn.join(',')}`;
                }
                if (proxy.tls?.insecure) {
                    surgeProxy += ', skip-cert-verify=true';
                }
                if (proxy.congestion_control) {
                    surgeProxy += `, congestion-controller=${proxy.congestion_control}`;
                }
                if (proxy.udp_relay_mode) {
                    surgeProxy += `, udp-relay-mode=${proxy.udp_relay_mode}`;
                }
                break;
            case 'vless':
                // Surge 不支持 VLESS，返回注释说明
                surgeProxy = `# ${proxy.tag} - VLESS protocol is not supported by Surge`;
                break;
            default:
                // 对于不支持的类型，返回注释说明
                surgeProxy = `# ${proxy.tag} - Unsupported proxy type: ${proxy.type}`;
        }
        return surgeProxy;
    }

    addSelectors() {
        let outbounds;
        if (typeof this.selectedRules === 'string' && PREDEFINED_RULE_SETS[this.selectedRules]) {
            outbounds = getOutbounds(PREDEFINED_RULE_SETS[this.selectedRules]);
        } else if (this.selectedRules && Object.keys(this.selectedRules).length > 0) {
            outbounds = getOutbounds(this.selectedRules);
        } else {
            outbounds = getOutbounds(PREDEFINED_RULE_SETS.minimal);
        }

        const proxyList = this.config.proxies || [];
        const proxyNames = proxyList.map(proxy => proxy.split('=')[0].trim());

        // 创建策略组配置生成器
        const createProxyGroup = (name, type, options = [], extraConfig = '') => {
            const baseOptions = type === 'url-test' ? [] : ['DIRECT', 'REJECT-DROP'];
            const allOptions = [...baseOptions, ...options, ...proxyNames];
            return `${name} = ${type}, ${allOptions.join(', ')}${extraConfig}`;
        };

        this.config['proxy-groups'] = this.config['proxy-groups'] || [];

        // 添加自动选择策略组
        this.config['proxy-groups'].push(
            createProxyGroup('⚡ 自动选择', 'url-test', [], ', url=http://www.gstatic.com/generate_204, interval=300')
        );

        // 添加节点选择策略组
        this.config['proxy-groups'].push(
            createProxyGroup('🚀 节点选择', 'select', ['⚡ 自动选择'])
        );

        // 添加其他策略组
        outbounds.forEach(outbound => {
            if (outbound !== '🚀 节点选择') {
                this.config['proxy-groups'].push(
                    createProxyGroup(outbound, 'select', ['🚀 节点选择'])
                );
            }
        });

        // 添加自定义规则组
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                this.config['proxy-groups'].push(
                    createProxyGroup(rule.name, 'select', ['🚀 节点选择'])
                );
            });
        }

        // 添加漏网之鱼策略组
        this.config['proxy-groups'].push(
            createProxyGroup('🐟 漏网之鱼', 'select', ['🚀 节点选择'])
        );
    }

    formatConfig() {
        const rules = generateRules(this.selectedRules, this.customRules, this.pin);

        // 构建最终配置
        let finalConfig = [];

        // 添加 MANAGED-CONFIG 配置
        if (this.subscriptionUrl) {
            finalConfig.push(`#!MANAGED-CONFIG ${this.subscriptionUrl} interval=43200 strict=false`);
            finalConfig.push('');  // 添加一个空行
        }

        // 添加通用配置
        finalConfig.push('[General]');
        if (this.config.general) {
            Object.entries(this.config.general).forEach(([key, value]) => {
                finalConfig.push(`${key} = ${value}`);
            });
        }

        // 添加 Replica 配置
        if (this.config.replica) {
            finalConfig.push('\n[Replica]');
            Object.entries(this.config.replica).forEach(([key, value]) => {
                finalConfig.push(`${key} = ${value}`);
            });
        }

        // 添加代理
        finalConfig.push('\n[Proxy]');
        finalConfig.push('DIRECT = direct');
        if (this.config.proxies) {
            finalConfig.push(...this.config.proxies);
        }

        // 添加策略组
        finalConfig.push('\n[Proxy Group]');
        if (this.config['proxy-groups']) {
            finalConfig.push(...this.config['proxy-groups']);
        }

        // 添加规则
        finalConfig.push('\n[Rule]');
        rules.forEach(rule => {
            // 将 GEOSITE 规则转换为 DOMAIN-SUFFIX 规则
            if (rule.site_rules[0] !== '') {
                rule.site_rules.forEach(site => {
                    // 特殊处理一些常见的 GEOSITE 规则
                    switch (site.toLowerCase()) {
                        case 'cn':
                            // 中国大陆域名
                            finalConfig.push(`DOMAIN-SUFFIX,cn,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-SUFFIX,com.cn,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-SUFFIX,edu.cn,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-SUFFIX,gov.cn,${rule.outbound}`);
                            break;
                        case 'google':
                            // Google 相关域名
                            finalConfig.push(`DOMAIN-SUFFIX,google.com,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-SUFFIX,googleapis.com,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-SUFFIX,googlevideo.com,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-KEYWORD,google,${rule.outbound}`);
                            break;
                        case 'telegram':
                            // Telegram 相关域名
                            finalConfig.push(`DOMAIN-SUFFIX,telegram.org,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-SUFFIX,telegram.me,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-SUFFIX,t.me,${rule.outbound}`);
                            finalConfig.push(`DOMAIN-KEYWORD,telegram,${rule.outbound}`);
                            break;
                        default:
                            // 其他域名规则转为 DOMAIN-KEYWORD
                            finalConfig.push(`DOMAIN-KEYWORD,${site},${rule.outbound}`);
                    }
                });
            }

            // 处理 IP 规则
            if (rule.ip_rules[0] !== '') {
                rule.ip_rules.forEach(ip => {
                    finalConfig.push(`GEOIP,${ip},${rule.outbound}`);
                });
            }

            // 处理域名后缀规则
            if (rule.domain_suffix) {
                rule.domain_suffix.forEach(suffix => {
                    finalConfig.push(`DOMAIN-SUFFIX,${suffix},${rule.outbound}`);
                });
            }

            // 处理域名关键词规则
            if (rule.domain_keyword) {
                rule.domain_keyword.forEach(keyword => {
                    finalConfig.push(`DOMAIN-KEYWORD,${keyword},${rule.outbound}`);
                });
            }

            // 处理 IP CIDR 规则
            if (rule.ip_cidr) {
                rule.ip_cidr.forEach(cidr => {
                    finalConfig.push(`IP-CIDR,${cidr},${rule.outbound}`);
                });
            }
        });

        // 添加最终规则
        finalConfig.push('FINAL,🐟 漏网之鱼');

        return finalConfig.join('\n');
    }

    getCurrentUrl() {
        try {
            // 如果在 Workers 环境中运行
            if (typeof self !== 'undefined' && self.location) {
                return self.location.href;
            }
            return null;
        } catch (error) {
            console.error('Error getting current URL:', error);
            return null;
        }
    }
} 