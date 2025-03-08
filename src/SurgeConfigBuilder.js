import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { generateRules, getOutbounds, PREDEFINED_RULE_SETS } from './config.js';
import { t } from './i18n/index.js';

export class SurgeConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent) {
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
        }, lang, userAgent);
        this.selectedRules = selectedRules;
        this.customRules = customRules;
        this.subscriptionUrl = null;
    }

    setSubscriptionUrl(url) {
        this.subscriptionUrl = url;
        return this;
    }

    getProxies() {
        return this.config.proxies || [];
    }

    getProxyName(proxy) {
        return proxy.split('=')[0].trim();
    }

    convertProxy(proxy) {
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
            default:
                surgeProxy = `# ${proxy.tag} - Unsupported proxy type: ${proxy.type}`;
        }
        return surgeProxy;
    }

    addProxyToConfig(proxy) {
        this.config.proxies = this.config.proxies || [];
        this.config.proxies.push(proxy);
    }

    createProxyGroup(name, type, options = [], extraConfig = '') {
        const baseOptions = type === 'url-test' ? [] : ['DIRECT', 'REJECT-DROP'];
        const proxyNames = this.getProxies().map(proxy => this.getProxyName(proxy));
        const allOptions = [...baseOptions, ...options, ...proxyNames];
        return `${name} = ${type}, ${allOptions.join(', ')}${extraConfig}`;
    }

    addAutoSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        this.config['proxy-groups'].push(
            this.createProxyGroup(t('outboundNames.Auto Select'), 'url-test', [], ', url=http://www.gstatic.com/generate_204, interval=300')
        );
    }

    addNodeSelectGroup(proxyList) {
        this.config['proxy-groups'].push(
            this.createProxyGroup(t('outboundNames.Node Select'), 'select', [t('outboundNames.Auto Select')])
        );
    }

    addOutboundGroups(outbounds, proxyList) {
        outbounds.forEach(outbound => {
            if (outbound !== t('outboundNames.Node Select')) {
                this.config['proxy-groups'].push(
                    this.createProxyGroup(t(`outboundNames.${outbound}`), 'select', [t('outboundNames.Node Select')])
                );
            }
        });
    }

    addCustomRuleGroups(proxyList) {
        if (Array.isArray(this.customRules)) {
            this.customRules.forEach(rule => {
                this.config['proxy-groups'].push(
                    this.createProxyGroup(rule.name, 'select', [t('outboundNames.Node Select')])
                );
            });
        }
    }

    addFallBackGroup(proxyList) {
        this.config['proxy-groups'].push(
            this.createProxyGroup(t('outboundNames.Fall Back'), 'select', [t('outboundNames.Node Select')])
        );
    }

    formatConfig() {
        const rules = generateRules(this.selectedRules, this.customRules);
        let finalConfig = [];

        if (this.subscriptionUrl) {
            finalConfig.push(`#!MANAGED-CONFIG ${this.subscriptionUrl} interval=43200 strict=false`);
            finalConfig.push('');  // 添加一个空行
        }

        finalConfig.push('[General]');
        if (this.config.general) {
            Object.entries(this.config.general).forEach(([key, value]) => {
                finalConfig.push(`${key} = ${value}`);
            });
        }

        if (this.config.replica) {
            finalConfig.push('\n[Replica]');
            Object.entries(this.config.replica).forEach(([key, value]) => {
                finalConfig.push(`${key} = ${value}`);
            });
        }

        finalConfig.push('\n[Proxy]');
        finalConfig.push('DIRECT = direct');
        if (this.config.proxies) {
            finalConfig.push(...this.config.proxies);
        }

        finalConfig.push('\n[Proxy Group]');
        if (this.config['proxy-groups']) {
            finalConfig.push(...this.config['proxy-groups']);
        }

        finalConfig.push('\n[Rule]');
        rules.forEach(rule => {
            if (rule.site_rules[0] !== '') {
                rule.site_rules.forEach(site => {
                    switch (site.toLowerCase()) {
                        case 'cn':
                            finalConfig.push(`DOMAIN-SUFFIX,cn,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-SUFFIX,com.cn,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-SUFFIX,edu.cn,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-SUFFIX,gov.cn,${t('outboundNames.'+ rule.outbound)}`);
                            break;
                        case 'google':
                            finalConfig.push(`DOMAIN-SUFFIX,google.com,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-SUFFIX,googleapis.com,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-SUFFIX,googlevideo.com,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-KEYWORD,google,${t('outboundNames.'+ rule.outbound)}`);
                            break;
                        case 'telegram':
                            finalConfig.push(`DOMAIN-SUFFIX,telegram.org,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-SUFFIX,telegram.me,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-SUFFIX,t.me,${t('outboundNames.'+ rule.outbound)}`);
                            finalConfig.push(`DOMAIN-KEYWORD,telegram,${t('outboundNames.'+ rule.outbound)}`);
                            break;
                        default:
                            finalConfig.push(`DOMAIN-KEYWORD,${site},${t('outboundNames.'+ rule.outbound)}`);
                    }
                });
            }

            if (rule.ip_rules[0] !== '') {
                rule.ip_rules.forEach(ip => {
                    finalConfig.push(`GEOIP,${ip},${t('outboundNames.'+ rule.outbound)},no-resolve`);
                });
            }

            if (rule.domain_suffix) {
                rule.domain_suffix.forEach(suffix => {
                    finalConfig.push(`DOMAIN-SUFFIX,${suffix},${t('outboundNames.'+ rule.outbound)}`);
                });
            }

            if (rule.domain_keyword) {
                rule.domain_keyword.forEach(keyword => {
                    finalConfig.push(`DOMAIN-KEYWORD,${keyword},${t('outboundNames.'+ rule.outbound)}`);
                });
            }

            if (rule.ip_cidr) {
                rule.ip_cidr.forEach(cidr => {
                    finalConfig.push(`IP-CIDR,${cidr},${t('outboundNames.'+ rule.outbound)},no-resolve`);
                });
            }
        });

        finalConfig.push('FINAL,' + t('outboundNames.Fall Back'));

        return finalConfig.join('\n');
    }

    getCurrentUrl() {
        try {
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