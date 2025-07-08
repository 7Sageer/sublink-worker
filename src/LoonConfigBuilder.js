import {BaseConfigBuilder} from './BaseConfigBuilder.js';
import {LOON_CONFIG, generateRules, getOutbounds, PREDEFINED_RULE_SETS} from './config.js';
import {t} from './i18n';

export class LoonConfigBuilder extends BaseConfigBuilder {
    constructor(inputString, selectedRules, customRules, baseConfig, lang, userAgent) {
        baseConfig = LOON_CONFIG;
        super(inputString, baseConfig, lang, userAgent);
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
        let loonProxy;
        switch (proxy.type) {
            case 'shadowsocks':
                loonProxy = `${proxy.tag} = shadowsocks,${proxy.server},${proxy.server_port},${proxy.method},"${proxy.password}"`;

                if (proxy.plugin === 'obfs-local' || proxy.plugin === 'simple-obfs') {
                    if (proxy.plugin_opts) {
                        const opts = proxy.plugin_opts.split(';');
                        const obfsMode = opts.find(opt => opt.startsWith('obfs='))?.split('=')[1];
                        const obfsHost = opts.find(opt => opt.startsWith('obfs-host='))?.split('=')[1];
                        if (obfsMode === 'http') {
                            loonProxy += `,obfs-name=http,obfs-host=${obfsHost || 'www.microsoft.com'},obfs-uri=/`;
                        } else if (obfsMode === 'tls') {
                            loonProxy += `,obfs-name=tls,obfs-host=${obfsHost || 'www.microsoft.com'}`;
                        }
                    }
                }

                loonProxy += ',fast-open=false,udp=true';
                break;
            case 'shadowsocksr':
                loonProxy = `${proxy.tag} = ShadowsocksR,${proxy.server},${proxy.server_port},${proxy.method},"${proxy.password}"`;
                if (proxy.protocol) {
                    loonProxy += `,protocol=${proxy.protocol}`;
                }
                if (proxy.protocol_param) {
                    loonProxy += `,protocol-param=${proxy.protocol_param}`;
                }
                if (proxy.obfs) {
                    loonProxy += `,obfs=${proxy.obfs}`;
                }
                if (proxy.obfs_param) {
                    loonProxy += `,obfs-param=${proxy.obfs_param}`;
                }

                // Shadow-TLS support for SSR
                if (proxy.shadow_tls) {
                    if (proxy.shadow_tls.password) {
                        loonProxy += `,shadow-tls-password=${proxy.shadow_tls.password}`;
                    }
                    if (proxy.shadow_tls.sni) {
                        loonProxy += `,shadow-tls-sni=${proxy.shadow_tls.sni}`;
                    }
                    if (proxy.shadow_tls.version) {
                        loonProxy += `,shadow-tls-version=${proxy.shadow_tls.version}`;
                    }
                }

                loonProxy += ',fast-open=false,udp=true';
                break;
            case 'vmess':
                loonProxy = `${proxy.tag} = vmess,${proxy.server},${proxy.server_port},${proxy.security || 'auto'},"${proxy.uuid}"`;

                if (proxy.alter_id !== undefined) {
                    loonProxy += `,alterId=${proxy.alter_id}`;
                } else {
                    loonProxy += `,alterId=0`;
                }

                if (proxy.transport) {
                    switch (proxy.transport.type) {
                        case 'ws':
                            loonProxy += `,transport=ws`;
                            if (proxy.transport.path) {
                                loonProxy += `,path=${proxy.transport.path}`;
                            }
                            if (proxy.transport.headers?.Host) {
                                loonProxy += `,host=${proxy.transport.headers.Host}`;
                            }
                            break;
                        case 'http':
                            loonProxy += `,transport=http`;
                            if (proxy.transport.path) {
                                loonProxy += `,path=${proxy.transport.path}`;
                            }
                            if (proxy.transport.headers?.Host) {
                                loonProxy += `,host=${proxy.transport.headers.Host}`;
                            }
                            break;
                        case 'tcp':
                        default:
                            loonProxy += `,transport=tcp`;
                            break;
                    }
                } else {
                    loonProxy += `,transport=tcp`;
                }

                if (proxy.tls?.enabled || proxy.tls) {
                    loonProxy += `,over-tls=true`;
                    if (proxy.tls?.server_name) {
                        loonProxy += `,tls-name=${proxy.tls.server_name}`;
                    } else {
                        loonProxy += `,tls-name=${proxy.server}`;
                    }
                    if (proxy.tls?.insecure || proxy.skip_cert_verify) {
                        loonProxy += `,skip-cert-verify=true`;
                    }
                } else {
                    loonProxy += `,over-tls=false`;
                }

                loonProxy += ',fast-open=false,udp=true';
                break;
            case 'vless':
                loonProxy = `${proxy.tag} = VLESS,${proxy.server},${proxy.server_port},"${proxy.uuid}"`;

                // Transport type
                if (proxy.transport) {
                    switch (proxy.transport.type) {
                        case 'ws':
                            loonProxy += `,transport=ws`;
                            if (proxy.transport.path) {
                                loonProxy += `,path=${proxy.transport.path}`;
                            }
                            if (proxy.transport.host) {
                                loonProxy += `,host=${proxy.transport.host}`;
                            }
                            break;
                        case 'http':
                            loonProxy += `,transport=http`;
                            if (proxy.transport.path) {
                                loonProxy += `,path=${proxy.transport.path}`;
                            }
                            if (proxy.transport.host) {
                                loonProxy += `,host=${proxy.transport.host}`;
                            }
                            break;
                        case 'tcp':
                            // TCP is default
                            break;
                    }
                } else {
                    loonProxy += `,transport=tcp`;
                }

                // TLS settings
                if (proxy.tls) {
                    loonProxy += `,over-tls=true`;
                    if (proxy.sni) {
                        loonProxy += `,tls-name=${proxy.sni}`;
                    } else if (proxy.tls?.server_name) {
                        loonProxy += `,tls-name=${proxy.tls.server_name}`;
                    } else {
                        loonProxy += `,tls-name=${proxy.server}`;
                    }
                    if (proxy.skip_cert_verify) {
                        loonProxy += `,skip-cert-verify=${proxy.skip_cert_verify}`;
                    }
                    // Reality support
                    if (proxy.tls.reality) {
                        if (proxy.tls.reality.public_key) {
                            loonProxy += `,public-key=${proxy.tls.reality.public_key}`;
                        }
                        if (proxy.tls.reality.short_id) {
                            loonProxy += `,reality-short-id=${proxy.tls.reality.short_id}`;
                        }
                    }
                    // XTLS support
                    if (proxy.flow === 'xtls-rprx-vision') {
                        loonProxy += `,flow=xtls-rprx-vision`;
                    }
                } else {
                    loonProxy += `,over-tls=false`;
                }

                loonProxy += ',fast-open=false,udp=true';
                break;
            case 'trojan':
                loonProxy = `${proxy.tag} = trojan,${proxy.server},${proxy.server_port},"${proxy.password}"`;

                if (proxy.tls?.alpn) {
                    loonProxy += `,alpn=${proxy.tls.alpn.join(',')}`;
                } else {
                    loonProxy += `,alpn=http1.1`;
                }

                if (proxy.transport && proxy.transport.type !== 'tcp') {
                    switch (proxy.transport.type) {
                        case 'ws':
                            loonProxy += `,transport=ws`;
                            if (proxy.transport.path) {
                                loonProxy += `,path=${proxy.transport.path}`;
                            }
                            if (proxy.transport.headers?.Host) {
                                loonProxy += `,host=${proxy.transport.headers.Host}`;
                            }
                            break;
                        case 'http':
                            loonProxy += `,transport=http`;
                            if (proxy.transport.path) {
                                loonProxy += `,path=${proxy.transport.path}`;
                            }
                            if (proxy.transport.headers?.Host) {
                                loonProxy += `,host=${proxy.transport.headers.Host}`;
                            }
                            break;
                    }
                }

                if (proxy.tls?.insecure || proxy.skip_cert_verify) {
                    loonProxy += `,skip-cert-verify=true`;
                } else {
                    loonProxy += `,skip-cert-verify=false`;
                }

                if (proxy.tls?.server_name) {
                    loonProxy += `,tls-name=${proxy.tls.server_name}`;
                } else if (proxy.sni) {
                    loonProxy += `,tls-name=${proxy.sni}`;
                } else {
                    loonProxy += `,tls-name=${proxy.server}`;
                }

                loonProxy += ',udp=true';
                break;
            case 'wireguard':
                loonProxy = `${proxy.tag} = wireguard,interface-ip=${proxy.local_address || '10.0.0.2'},interface-ipv6=${proxy.local_address_ipv6 || ''},private-key=${proxy.private_key},dns=${proxy.dns || '1.1.1.1,8.8.8.8'},mtu=${proxy.mtu || 1280}`;

                // Peer configuration
                if (proxy.peers && proxy.peers.length > 0) {
                    const peer = proxy.peers[0]; // Use first peer
                    loonProxy += `,peer=(public-key=${peer.public_key},allowed-ips=${peer.allowed_ips || '0.0.0.0/0,::/0'},endpoint=${peer.server}:${peer.server_port}`;
                    if (peer.pre_shared_key) {
                        loonProxy += `,pre-shared-key=${peer.pre_shared_key}`;
                    }
                    if (peer.reserved) {
                        loonProxy += `,reserved=${peer.reserved}`;
                    }
                    loonProxy += ')';
                } else {
                    // Fallback for simple configuration
                    loonProxy += `,peer=(public-key=${proxy.public_key},allowed-ips=${proxy.allowed_ips || '0.0.0.0/0,::/0'},endpoint=${proxy.server}:${proxy.server_port}`;
                    if (proxy.pre_shared_key) {
                        loonProxy += `,pre-shared-key=${proxy.pre_shared_key}`;
                    }
                    if (proxy.reserved) {
                        loonProxy += `,reserved=${proxy.reserved}`;
                    }
                    loonProxy += ')';
                }
                break;
            case 'hysteria2':
                loonProxy = `${proxy.tag} = hysteria2,${proxy.server},${proxy.server_port},"${proxy.password}"`;

                if (proxy.up_mbps || proxy.up) {
                    loonProxy += `,up=${proxy.up_mbps || proxy.up}`;
                }
                if (proxy.down_mbps || proxy.down) {
                    loonProxy += `,down=${proxy.down_mbps || proxy.down}`;
                }

                if (proxy.sni) {
                    loonProxy += `,sni=${proxy.sni}`;
                } else if (proxy.tls?.server_name) {
                    loonProxy += `,sni=${proxy.tls.server_name}`;
                } else {
                    loonProxy += `,sni=${proxy.server}`;
                }

                if (proxy.skip_cert_verify || proxy.tls?.insecure) {
                    loonProxy += ',skip-cert-verify=true';
                } else {
                    loonProxy += ',skip-cert-verify=false';
                }

                if (proxy.obfs && proxy.obfs_password) {
                    loonProxy += `,obfs=${proxy.obfs},obfs-password=${proxy.obfs_password}`;
                }

                loonProxy += ',udp=true';
                break;
            case 'http':
                loonProxy = `${proxy.tag} = http,${proxy.server},${proxy.server_port}`;
                if (proxy.username && proxy.password) {
                    loonProxy += `,"${proxy.username}","${proxy.password}"`;
                }

                if (proxy.tls) {
                    loonProxy += ',over-tls=true';
                    if (proxy.tls?.server_name) {
                        loonProxy += `,tls-name=${proxy.tls.server_name}`;
                    }
                    if (proxy.tls?.insecure || proxy['skip-cert-verify']) {
                        loonProxy += ',skip-cert-verify=true';
                    }
                }
                break;
            case 'https':
                loonProxy = `${proxy.tag} = https,${proxy.server},${proxy.server_port}`;
                if (proxy.username && proxy.password) {
                    loonProxy += `,"${proxy.username}","${proxy.password}"`;
                }

                if (proxy.tls?.server_name) {
                    loonProxy += `,tls-name=${proxy.tls.server_name}`;
                }
                if (proxy.tls?.insecure || proxy['skip-cert-verify']) {
                    loonProxy += ',skip-cert-verify=true';
                }
                break;
            case 'socks5':
                loonProxy = `${proxy.tag} = socks5,${proxy.server},${proxy.server_port}`;
                if (proxy.username && proxy.password) {
                    loonProxy += `,"${proxy.username}","${proxy.password}"`;
                }

                if (proxy.tls) {
                    loonProxy += ',over-tls=true';
                    if (proxy.tls?.server_name) {
                        loonProxy += `,tls-name=${proxy.tls.server_name}`;
                    }
                    if (proxy.tls?.insecure || proxy['skip-cert-verify']) {
                        loonProxy += ',skip-cert-verify=true';
                    }
                }
                loonProxy += ',udp=true';
                break;
            case 'custom':
            case 'js':
                // Custom by JS protocol
                if (proxy.script_path) {
                    loonProxy = `${proxy.tag} = custom,${proxy.server},${proxy.server_port},${proxy.script_path}`;
                    if (proxy.script_args) {
                        loonProxy += `,${proxy.script_args}`;
                    }
                } else {
                    loonProxy = `# ${proxy.tag} - Script path is required for custom protocol`;
                }
                break;
            default:
                loonProxy = `# ${proxy.tag} - Unsupported proxy type: ${proxy.type}`;
        }
        return loonProxy;
    }

    addProxyToConfig(proxy) {
        this.config.proxies = this.config.proxies || [];

        // Get the name of the proxy to be added
        const proxyName = this.getProxyName(proxy);

        // Check if there are proxies with similar names in existing proxies
        const similarProxies = this.config.proxies
            .map(p => this.getProxyName(p))
            .filter(name => name.includes(proxyName));

        // Check if there is a proxy with identical configuration
        const isIdentical = this.config.proxies.some(p =>
            // Compare the remaining configuration after removing the name part
            p.substring(p.indexOf('=')) === proxy.substring(proxy.indexOf('='))
        );

        if (isIdentical) {
            // If there is a proxy with identical configuration, skip adding it
            return;
        }

        // If there are proxies with similar names but different configurations, modify the name
        if (similarProxies.length > 0) {
            // Get the position of the equals sign
            const equalsPos = proxy.indexOf('=');
            if (equalsPos > 0) {
                // Create a new proxy string with a number appended to the name
                proxy = `${proxyName} ${similarProxies.length + 1}${proxy.substring(equalsPos)}`;
            }
        }

        this.config.proxies.push(proxy);
    }

    createProxyGroup(name, type, options = [], extraConfig = '') {
        const baseOptions = type === 'url-test' ? [] : ['DIRECT', 'REJECT'];
        const proxyNames = this.getProxies().map(proxy => this.getProxyName(proxy));
        const allOptions = [...baseOptions, ...options, ...proxyNames];
        return `${name} = ${type},${allOptions.join(',')}${extraConfig}`;
    }

    addAutoSelectGroup(proxyList) {
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        this.config['proxy-groups'].push(
            this.createProxyGroup(t('outboundNames.Auto Select'), 'url-test', [], ',url=http://www.gstatic.com/generate_204,interval=300')
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

        finalConfig.push('\n[Proxy]');
        if (this.config.proxies) {
            finalConfig.push(...this.config.proxies);
        }

        finalConfig.push('\n[Proxy Group]');
        if (this.config['proxy-groups']) {
            finalConfig.push(...this.config['proxy-groups']);
        }

        finalConfig.push('\n[Rule]');

        // Domain rules first to reduce DNS leaks
        rules.filter(rule => !!rule.domain_suffix).map(rule => {
            rule.domain_suffix.forEach(suffix => {
                finalConfig.push(`DOMAIN-SUFFIX,${suffix},${t('outboundNames.' + rule.outbound)}`);
            });
        });

        rules.filter(rule => !!rule.domain_keyword).map(rule => {
            rule.domain_keyword.forEach(keyword => {
                finalConfig.push(`DOMAIN-KEYWORD,${keyword},${t('outboundNames.' + rule.outbound)}`);
            });
        });

        // IP rules
        rules.filter(rule => !!rule.ip_cidr).map(rule => {
            rule.ip_cidr.forEach(cidr => {
                finalConfig.push(`IP-CIDR,${cidr},${t('outboundNames.' + rule.outbound)},no-resolve`);
            });
        });

        // GeoIP rules
        rules.filter(rule => !!rule.geoip).map(rule => {
            rule.geoip.forEach(geoip => {
                finalConfig.push(`GEOIP,${geoip},${t('outboundNames.' + rule.outbound)}`);
            });
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
