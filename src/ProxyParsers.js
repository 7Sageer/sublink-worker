import { parseServerInfo, parseUrlParams, createTlsConfig, createTransportConfig, decodeBase64, base64ToBinary } from './utils.js';


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
            let transport = {}
            if (vmessConfig.net === 'ws') {
                transport = {
                    "type": "ws",
                    "path": vmessConfig.path,
                    "headers": { 'Host': vmessConfig.host? vmessConfig.host : vmessConfig.sni  }
                }
                if (vmessConfig.tls !== '') {
                    tls = {
                        "enabled": true,
                        "server_name": vmessConfig.sni,
                        "insecure": false
                    }
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
                "network": "tcp",
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
          };
      
          return {
            tag: name,
            type: "hysteria2",
            server: host,
            server_port: port,
            password: password,
            tls: tls,
            obfs: obfs,
            auth: params.auth,
            recv_window_conn: params.recv_window_conn,
            up_mbps: params?.upmbps ? parseInt(params.upmbps) : undefined,
            down_mbps: params?.downmbps ? parseInt(params.downmbps) : undefined
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
          const tls = {
            enabled: true,
            server_name: params.sni,
            alpn: [params.alpn],
            insecure: true,
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
            flow: params.flow ?? undefined
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
                return decodedText.split('\n').filter(line => line.trim() !== '');
            } catch (error) {
                console.error('Error fetching or parsing HTTP(S) content:', error);
                return null;
            }
        }
    }
