import { parseServerInfo, parseUrlParams, createTlsConfig, createTransportConfig, decodeBase64, base64ToBinary, DeepCopy } from './utils.js';
import yaml from 'js-yaml';

// Shared: convert a Clash YAML proxy entry to internal proxy object
export function convertYamlProxyToObject(p) {
  if (!p || typeof p !== 'object' || !p.type) return null;
  const type = String(p.type).toLowerCase();
  const name = p.name || p.tag || 'proxy';
  const toArray = (value) => {
    if (value === undefined || value === null) return undefined;
    return Array.isArray(value) ? value : [value];
  };
  switch (type) {
    case 'ss':
    case 'shadowsocks':
      return {
        tag: name,
        type: 'shadowsocks',
        server: p.server,
        server_port: parseInt(p.port),
        method: p.cipher || p.method,
        password: p.password,
        network: 'tcp',
        tcp_fast_open: !!p['fast-open']
      };
    case 'vmess': {
      const tlsEnabled = !!p.tls;
      const tls = tlsEnabled
        ? {
            enabled: true,
            server_name: p.servername || p.sni,
            insecure: !!p['skip-cert-verify']
          }
        : { enabled: false };
      const transport = (() => {
        const net = p.network || p['network-type'];
        if (net === 'ws') {
          const w = p['ws-opts'] || {};
          return { type: 'ws', path: w.path, headers: w.headers };
        }
        if (net === 'grpc') {
          const g = p['grpc-opts'] || {};
          return { type: 'grpc', service_name: g['grpc-service-name'] };
        }
        if (net === 'http') {
          const h = p['http-opts'] || {};
          return { type: 'http', method: h.method || 'GET', path: h.path, headers: h.headers };
        }
        if (net === 'h2') {
          const h2 = p['h2-opts'] || {};
          return { type: 'h2', path: h2.path, host: h2.host };
        }
        return undefined;
      })();
      return {
        tag: name,
        type: 'vmess',
        server: p.server,
        server_port: parseInt(p.port),
        uuid: p.uuid,
        alter_id: typeof p.alterId !== 'undefined' ? parseInt(p.alterId) : undefined,
        security: p.cipher || p.security || 'auto',
        network: transport?.type || p.network || 'tcp',
        tcp_fast_open: typeof p['fast-open'] !== 'undefined' ? !!p['fast-open'] : false,
        transport,
        tls,
        udp: typeof p.udp !== 'undefined' ? !!p.udp : undefined,
        packet_encoding: p['packet-encoding'],
        alpn: toArray(p.alpn)
      };
    }
    case 'vless': {
      const tlsEnabled = !!p.tls;
      const reality = p['reality-opts'];
      const tls = tlsEnabled
        ? {
            enabled: true,
            server_name: p.servername || p.sni,
            insecure: !!p['skip-cert-verify'],
            ...(reality
              ? { reality: { enabled: true, public_key: reality['public-key'], short_id: reality['short-id'] } }
              : {})
          }
        : { enabled: false };
      if (p['client-fingerprint']) {
        tls.utls = {
          enabled: true,
          fingerprint: p['client-fingerprint']
        };
      }
      const transport = (() => {
        const net = p.network;
        if (net === 'ws') {
          const w = p['ws-opts'] || {};
          return { type: 'ws', path: w.path, headers: w.headers };
        }
        if (net === 'grpc') {
          const g = p['grpc-opts'] || {};
          return { type: 'grpc', service_name: g['grpc-service-name'] };
        }
        if (net === 'http') {
          const h = p['http-opts'] || {};
          return { type: 'http', method: h.method || 'GET', path: h.path, headers: h.headers };
        }
        if (net === 'h2') {
          const h2 = p['h2-opts'] || {};
          return { type: 'h2', path: h2.path, host: h2.host };
        }
        return undefined;
      })();
      return {
        tag: name,
        type: 'vless',
        server: p.server,
        server_port: parseInt(p.port),
        uuid: p.uuid,
        tcp_fast_open: typeof p['fast-open'] !== 'undefined' ? !!p['fast-open'] : false,
        tls,
        transport,
        network: transport?.type || 'tcp',
        flow: p.flow ?? undefined,
        udp: typeof p.udp !== 'undefined' ? !!p.udp : undefined,
        packet_encoding: p['packet-encoding'],
        alpn: toArray(p.alpn)
      };
    }
    case 'trojan': {
      const tlsEnabled = !!p.tls;
      const reality = p['reality-opts'];
      const tls = tlsEnabled
        ? {
            enabled: true,
            server_name: p.servername || p.sni,
            insecure: !!p['skip-cert-verify'],
            ...(reality
              ? { reality: { enabled: true, public_key: reality['public-key'], short_id: reality['short-id'] } }
              : {})
          }
        : { enabled: false };
      if (p['client-fingerprint']) {
        tls.utls = {
          enabled: true,
          fingerprint: p['client-fingerprint']
        };
      }
      const transport = (() => {
        const net = p.network;
        if (net === 'ws') {
          const w = p['ws-opts'] || {};
          return { type: 'ws', path: w.path, headers: w.headers };
        }
        if (net === 'grpc') {
          const g = p['grpc-opts'] || {};
          return { type: 'grpc', service_name: g['grpc-service-name'] };
        }
        if (net === 'http') {
          const h = p['http-opts'] || {};
          return { type: 'http', method: h.method || 'GET', path: h.path, headers: h.headers };
        }
        if (net === 'h2') {
          const h2 = p['h2-opts'] || {};
          return { type: 'h2', path: h2.path, host: h2.host };
        }
        return undefined;
      })();
      return {
        type: 'trojan',
        tag: name,
        server: p.server,
        server_port: parseInt(p.port),
        password: p.password,
        network: transport?.type || p.network || 'tcp',
        tcp_fast_open: typeof p['fast-open'] !== 'undefined' ? !!p['fast-open'] : false,
        tls,
        transport,
        flow: p.flow ?? undefined,
        alpn: toArray(p.alpn)
      };
    }
    case 'hysteria2':
    case 'hysteria':
    case 'hy2': {
      const tls = {
        enabled: true,
        server_name: p.sni,
        insecure: !!p['skip-cert-verify']
      };
      const obfs = {};
      if (p.obfs) {
        obfs.type = p.obfs;
        obfs.password = p['obfs-password'];
      }
      const hopIntervalRaw = p['hop-interval'];
      const hopInterval = Number(hopIntervalRaw);
      return {
        tag: name,
        type: 'hysteria2',
        server: p.server,
        server_port: parseInt(p.port),
        password: p.password,
        tls,
        obfs: Object.keys(obfs).length > 0 ? obfs : undefined,
        auth: p.auth,
        recv_window_conn: p['recv-window-conn'],
        up: p.up,
        down: p.down,
        ports: p.ports,
        hop_interval: Number.isNaN(hopInterval) ? hopIntervalRaw : hopInterval,
        alpn: toArray(p.alpn),
        fast_open: typeof p['fast-open'] !== 'undefined' ? !!p['fast-open'] : undefined
      };
    }
    case 'tuic': {
      return {
        tag: name,
        type: 'tuic',
        server: p.server,
        server_port: parseInt(p.port),
        uuid: p.uuid,
        password: p.password,
        congestion_control: p['congestion-controller'] || p.congestion_control,
        tls: {
          enabled: true,
          server_name: p.sni,
          alpn: toArray(p.alpn),
          insecure: !!p['skip-cert-verify']
        },
        flow: p.flow ?? undefined,
        udp_relay_mode: p['udp-relay-mode'],
        zero_rtt: typeof p['zero-rtt'] !== 'undefined' ? !!p['zero-rtt'] : undefined,
        reduce_rtt: typeof p['reduce-rtt'] !== 'undefined' ? !!p['reduce-rtt'] : undefined,
        fast_open: typeof p['fast-open'] !== 'undefined' ? !!p['fast-open'] : undefined,
        disable_sni: typeof p['disable-sni'] !== 'undefined' ? !!p['disable-sni'] : undefined
      };
    }
    default:
      return null;
  }
}


export class ProxyParser {
	static parse(url, userAgent) {
		url = url.trim();
		const type = url.split('://')[0];
		switch(type) {
			case 'ss': return new ShadowsocksParser().parse(url);
			case 'vmess': return new VmessParser().parse(url);
			case 'vless': return new VlessParser().parse(url);
      case 'hysteria':
      case 'hysteria2': 
      case 'hy2':
        return new Hysteria2Parser().parse(url);
      case 'http':
      case 'https':
        return HttpParser.parse(url, userAgent);
      case 'trojan': return new TrojanParser().parse(url);
      case 'tuic': return new TuicParser().parse(url);
		}
	}
	}
	class ShadowsocksParser {
		parse(url) {
			let parts = url.replace('ss://', '').split('#');
			let mainPart = parts[0];
			let tag = parts[1];
			if (tag && tag.includes('%')) {
				tag = decodeURIComponent(tag);
			}

			// Try new format first
			try {
				let [base64, serverPart] = mainPart.split('@');
				// If no @ symbol found, try legacy format
				if (!serverPart) {
					// Decode the entire mainPart for legacy format
					let decodedLegacy = base64ToBinary(mainPart);
					// Legacy format: method:password@server:port
					let [methodAndPass, serverInfo] = decodedLegacy.split('@');
					let [method, password] = methodAndPass.split(':');
					let [server, server_port] = this.parseServer(serverInfo);
					
					return this.createConfig(tag, server, server_port, method, password);
				}

				// Continue with new format parsing
				let decodedParts = base64ToBinary(decodeURIComponent(base64)).split(':');
				let method = decodedParts[0];
				let password = decodedParts.slice(1).join(':');
				let [server, server_port] = this.parseServer(serverPart);

				return this.createConfig(tag, server, server_port, method, password);
			} catch (e) {
				console.error('Failed to parse shadowsocks URL:', e);
				return null;
			}
		}

		// Helper method to parse server info
		parseServer(serverPart) {
			// Match IPv6 address
			let match = serverPart.match(/\[([^\]]+)\]:(\d+)/);
			if (match) {
				return [match[1], match[2]];
			}
			return serverPart.split(':');
		}

		// Helper method to create config object
		createConfig(tag, server, server_port, method, password) {
			return {
				"tag": tag || "Shadowsocks",
				"type": 'shadowsocks',
				"server": server,
				"server_port": parseInt(server_port),
				"method": method,
				"password": password,
				"network": 'tcp',
				"tcp_fast_open": false
			};
		}
	}

	class VmessParser {
		parse(url) {
            let base64 = url.replace('vmess://', '')
            let vmessConfig = JSON.parse(decodeBase64(base64))
            let tls = { "enabled": false }
            let transport;
            const networkType = vmessConfig.net || 'tcp';
            const transportType = vmessConfig.type || networkType;

            const tlsEnabled = vmessConfig.tls && vmessConfig.tls !== '' && vmessConfig.tls !== 'none';
            if (tlsEnabled) {
                tls = {
                    "enabled": true,
                    "server_name": vmessConfig.sni,
                    "insecure": vmessConfig['skip-cert-verify'] || false
                }
            }

            if (networkType === 'ws') {
                transport = {
                    "type": "ws",
                    "path": vmessConfig.path,
                    "headers": { 'Host': vmessConfig.host ? vmessConfig.host : vmessConfig.sni }
                }
            } else if ((networkType === 'tcp' && transportType === 'http') || networkType === 'http') {
                const method = vmessConfig.method || 'GET';
                const path = vmessConfig.path || '/';
                const normalizeToArray = (value) => {
                    if (!value) {
                        return undefined;
                    }
                    return Array.isArray(value) ? value : [value];
                };
                const headers = (() => {
                    const hostHeader = normalizeToArray(vmessConfig.host || vmessConfig.sni);
                    if (vmessConfig.headers && typeof vmessConfig.headers === 'object') {
                        const normalized = {};
                        Object.entries(vmessConfig.headers).forEach(([key, value]) => {
                            const normalizedValue = normalizeToArray(value)?.map(entry => `${entry}`);
                            if (normalizedValue && normalizedValue.length > 0) {
                                normalized[key] = normalizedValue;
                            }
                        });
                        if (hostHeader && !normalized.Host) {
                            normalized.Host = hostHeader;
                        }
                        if (Object.keys(normalized).length > 0) {
                            return normalized;
                        }
                    }

                    return hostHeader ? { 'Host': hostHeader } : undefined;
                })();

                transport = {
                    "type": "http",
                    "method": method,
                    "path": Array.isArray(path) ? path : [path],
                    "headers": headers
                }
            } else if (networkType === 'grpc') {
                transport = {
                    "type": "grpc",
                    "service_name": vmessConfig?.path || vmessConfig?.serviceName
                }
            } else if (networkType === 'h2') {
                const hostValue = vmessConfig.host || vmessConfig.sni;
                transport = {
                    "type": "h2",
                    "path": vmessConfig.path,
                    "host": hostValue ? (Array.isArray(hostValue) ? hostValue : [hostValue]) : undefined
                }
            }
            return {
                "tag": vmessConfig.ps,
                "type": "vmess",
                "server": vmessConfig.add,
                "server_port": parseInt(vmessConfig.port),
                "uuid": vmessConfig.id,
                "alter_id": parseInt(vmessConfig.aid),
                "security": vmessConfig.scy || "auto",
                "network": transport?.type || networkType || "tcp",
                "tcp_fast_open": false,
                "transport": transport,
                "tls": tls.enabled ? tls : undefined
            }

		}
	}

    class VlessParser {
        parse(url) {
          const { addressPart, params, name } = parseUrlParams(url);
          const [uuid, serverInfo] = addressPart.split('@');
          const { host, port } = parseServerInfo(serverInfo);
      
          const tls = createTlsConfig(params);
          if (tls.reality){
            tls.utls = {
              enabled: true,
              fingerprint: "chrome",
            }
          }
          const transport = params.type !== 'tcp' ? createTransportConfig(params) : undefined;
      
          return {
            type: "vless",
            tag: name,
            server: host,
            server_port: port,
            uuid: decodeURIComponent(uuid),
            tcp_fast_open: false,
            tls: tls,
            transport: transport,
            network: "tcp",
            flow: params.flow ?? undefined
          };
        }
      }
      
      class Hysteria2Parser {
        parse(url) {
          const { addressPart, params, name } = parseUrlParams(url);
          // 处理不包含 @ 的 URL 格式
          let host, port;
          let password = null;

          const parseBool = (value) => {
            if (value === undefined || value === null) return undefined;
            if (typeof value === 'boolean') return value;
            const lowered = String(value).toLowerCase();
            if (lowered === 'true' || lowered === '1') return true;
            if (lowered === 'false' || lowered === '0') return false;
            return undefined;
          };

          const parseMaybeNumber = (value) => {
            if (value === undefined || value === null) return undefined;
            const num = Number(value);
            return Number.isNaN(num) ? undefined : num;
          };

          const parseArray = (value) => {
            if (!value) return undefined;
            if (Array.isArray(value)) return value;
            return String(value)
              .split(',')
              .map(entry => entry.trim())
              .filter(entry => entry.length > 0);
          };
          
          if (addressPart.includes('@')) {
            const [uuid, serverInfo] = addressPart.split('@');
            const parsed = parseServerInfo(serverInfo);
            host = parsed.host;
            port = parsed.port;
            password = decodeURIComponent(uuid);
          } else {
            // 直接解析服务器地址和端口
            const parsed = parseServerInfo(addressPart);
            host = parsed.host;
            port = parsed.port;
            // 如果 URL 中没有 @，则尝试从 params.auth 获取密码
            password = params.auth;
          }
      
          const tls = createTlsConfig(params);

          const obfs = {};
          if (params['obfs-password']) {
            obfs.type = params.obfs;
            obfs.password = params['obfs-password'];
          }

          const hopInterval = parseMaybeNumber(params['hop-interval']);

          return {
            tag: name,
            type: "hysteria2",
            server: host,
            server_port: port,
            password: password,
            tls: tls,
            obfs: Object.keys(obfs).length > 0 ? obfs : undefined,
            auth: params.auth,
            recv_window_conn: params.recv_window_conn,
            up: params.up ?? (params.upmbps ? parseMaybeNumber(params.upmbps) : undefined),
            down: params.down ?? (params.downmbps ? parseMaybeNumber(params.downmbps) : undefined),
            ports: params.ports,
            hop_interval: hopInterval,
            alpn: parseArray(params.alpn),
            fast_open: parseBool(params['fast-open'])
          };
        }
      }

      class TrojanParser {
        parse(url) {
          const { addressPart, params, name } = parseUrlParams(url);
          const [password, serverInfo] = addressPart.split('@');
          const { host, port } = parseServerInfo(serverInfo);

          const parsedURL = parseServerInfo(addressPart);
          const tls = createTlsConfig(params);
          const transport = params.type !== 'tcp' ? createTransportConfig(params) : undefined;
          return {
            type: 'trojan',
            tag: name,
            server: host,
            server_port: port,
            password: decodeURIComponent(password) || parsedURL.username,
            network: "tcp",
            tcp_fast_open: false,
            tls: tls,
            transport: transport,
            flow: params.flow ?? undefined
          };
        }
      }

      class TuicParser {
        
        parse(url) {
          const { addressPart, params, name } = parseUrlParams(url);
          const [userinfo, serverInfo] = addressPart.split('@');
          const { host, port } = parseServerInfo(serverInfo);
          const parseBool = (value, fallback) => {
            if (value === undefined || value === null) return fallback;
            if (typeof value === 'boolean') return value;
            const lowered = String(value).toLowerCase();
            if (lowered === 'true' || lowered === '1') return true;
            if (lowered === 'false' || lowered === '0') return false;
            return fallback;
          };
          const parseArray = (value) => {
            if (!value) return undefined;
            if (Array.isArray(value)) return value;
            return String(value)
              .split(',')
              .map(entry => entry.trim())
              .filter(entry => entry.length > 0);
          };
          const tls = {
            enabled: true,
            server_name: params.sni,
            alpn: parseArray(params.alpn),
            insecure: parseBool(params['skip-cert-verify'] ?? params.insecure ?? params.allowInsecure, true),
          };
      
          return {
            tag: name,
            type: "tuic",
            server: host,
            server_port: port,
            uuid: decodeURIComponent(userinfo).split(':')[0],
            password: decodeURIComponent(userinfo).split(':')[1],
            congestion_control: params.congestion_control,
            tls: tls,
            flow: params.flow ?? undefined,
            udp_relay_mode: params['udp-relay-mode'] || params.udp_relay_mode,
            zero_rtt: parseBool(params['zero-rtt'], undefined),
            reduce_rtt: parseBool(params['reduce-rtt'], undefined),
            fast_open: parseBool(params['fast-open'], undefined),
            disable_sni: parseBool(params['disable-sni'], undefined)
          };
        }
      }
      

      class HttpParser {
        static async parse(url, userAgent) {
            try {
                let headers = new Headers({
                  "User-Agent"   : userAgent
                });
                const response = await fetch(url, {
                  method : 'GET',
                  headers : headers
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                let decodedText;
                try {
                    decodedText = decodeBase64(text.trim());
                    // Check if the decoded text needs URL decoding
                    if (decodedText.includes('%')) {
                        decodedText = decodeURIComponent(decodedText);
                    }
                } catch (e) {
                    decodedText = text;
                    // Check if the original text needs URL decoding
                    if (decodedText.includes('%')) {
                        try {
                            decodedText = decodeURIComponent(decodedText);
                        } catch (urlError) {
                            console.warn('Failed to URL decode the text:', urlError);
                        }
                    }
                }
                // Try YAML first: if content parses and has proxies, convert to internal objects
                try {
                    const parsed = yaml.load(decodedText);
                    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.proxies)) {
                        const proxies = parsed.proxies
                          .map(p => convertYamlProxyToObject(p))
                          .filter(p => p != null);
                        if (proxies.length > 0) {
                            const configOverrides = DeepCopy(parsed);
                            delete configOverrides.proxies;
                            return {
                                type: 'yamlConfig',
                                proxies,
                                config: Object.keys(configOverrides).length > 0 ? configOverrides : null
                            };
                        }
                    }
                } catch (yamlError) {
                    console.warn('YAML parsing failed; fallback to line mode:', yamlError?.message || yamlError);
                }

                // Fallback: treat as subscription lines
                return decodedText.split('\n').filter(line => line.trim() !== '');
            } catch (error) {
                console.error('Error fetching or parsing HTTP(S) content:', error);
                return null;
            }
        }

        // moved to shared helper convertYamlProxyToObject
    }
