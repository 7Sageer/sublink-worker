import yaml from 'js-yaml';
import { ProxyParser } from './ProxyParsers.js';
import { CLASH_CONFIG, SELECTORS_LIST } from './config.js';
import { DeepCopy } from './utils.js';

export class ClashConfigBuilder {
    constructor(inputString) {
        this.inputString = inputString;
        this.config = DeepCopy(CLASH_CONFIG);
    }

    async build() {
        const customProxies = await this.parseCustomProxies();
        this.addCustomProxies(customProxies);
        return yaml.dump(this.config);
    }

    async parseCustomProxies() {
        const urls = this.inputString.split('\n').filter(url => url.trim() !== '');
        const parsedProxies = [];

        for (const url of urls) {
            const result = await ProxyParser.parse(url);
            if (Array.isArray(result)) {
                // If the result is an array, it's from an HTTP(S) source
                for (const subUrl of result) {
                    const subResult = await ProxyParser.parse(subUrl);
                    if (subResult) {
                        parsedProxies.push(subResult);
                    }
                }
            } else if (result) {
                parsedProxies.push(result);
            }
        }

        return parsedProxies;
    }

	addCustomProxies(customProxies) {
		customProxies.forEach(proxy => {
            if (proxy?.tag && !this.config.proxies.some(p => p.name === proxy.tag)) {
                this.config.proxies.push(this.convertToClashProxy(proxy));
            }
		});
		const proxyList = customProxies.filter(proxy => proxy?.tag !== undefined).map(proxy => proxy?.tag);
        this.config['proxy-groups'].push({
            name: '⚡ 自动选择',
            type: 'url-test',
            proxies: DeepCopy(proxyList),
            url: 'https://www.gstatic.com/generate_204',
            interval: 300,
            lazy: false
        });
        proxyList.unshift('DIRECT', 'REJECT', '⚡ 自动选择');
		SELECTORS_LIST.forEach(selector => {
			if (!this.config['proxy-groups'].some(g => g.name === selector)) {
				this.config['proxy-groups'].push({
					type: "select",
					name: selector,
					proxies: selector !== '🚀 节点选择' ? ['🚀 节点选择', ...proxyList] : proxyList
				});
			}
		});
	}

    convertToClashProxy(proxy) {
        switch(proxy.type) {
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
                    alterId: proxy.alter_id,
                    cipher: proxy.security,
                    tls: proxy.tls?.enabled || false,
                    servername: proxy.tls?.server_name || '',
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    } : undefined
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
                    'client-fingerprint': proxy.tls.utls?.fingerprint,
                    servername: proxy.tls?.server_name || '',
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    }: undefined,
                    'reality-opts': proxy.tls.reality?.enabled ? {
                        'public-key': proxy.tls.reality.public_key,
                        'short-id': proxy.tls.reality.short_id,
                    } : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc' ? {
                        'grpc-mode': 'gun',
                        'grpc-service-name': proxy.transport.service_name,
                    } : undefined,
                    tfo : proxy.tcp_fast_open,
                    'skip-cert-verify': proxy.tls.insecure,
                    'flow': proxy.flow ?? undefined,
                };
            case 'hysteria2':
                return {
                    name: proxy.tag,
                    type: proxy.type,
                    server: proxy.server,
                    port: proxy.server_port,
                    password: proxy.password,
                    auth: proxy.password,
                    'skip-cert-verify': proxy.tls.insecure,
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
                    'client-fingerprint': proxy.tls.utls?.fingerprint,
                    servername: proxy.tls?.server_name || '',
                    network: proxy.transport?.type || 'tcp',
                    'ws-opts': proxy.transport?.type === 'ws' ? {
                        path: proxy.transport.path,
                        headers: proxy.transport.headers
                    }: undefined,
                    'reality-opts': proxy.tls.reality?.enabled ? {
                        'public-key': proxy.tls.reality.public_key,
                        'short-id': proxy.tls.reality.short_id,
                    } : undefined,
                    'grpc-opts': proxy.transport?.type === 'grpc' ? {
                        'grpc-mode': 'gun',
                        'grpc-service-name': proxy.transport.service_name,
                    } : undefined,
                    tfo : proxy.tcp_fast_open,
                    'skip-cert-verify': proxy.tls.insecure,
                    'flow': proxy.flow ?? undefined,
				}
            default:
                return proxy; // Return as-is if no specific conversion is defined
        }
    }
}