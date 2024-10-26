import { parseServerInfo, parseUrlParams, createTlsConfig, createTransportConfig, decodeBase64 } from './utils.js';


export class ProxyParser {
	static parse(url) {
		url = url.trim();
		const type = url.split('://')[0];
		switch(type) {
			case 'ss': return new ShadowsocksParser().parse(url);
			case 'vmess': return new VmessParser().parse(url);
			case 'vless': return new VlessParser().parse(url);
      case 'hysteria2': return new Hysteria2Parser().parse(url);
      case 'http':
      case 'https':
      return HttpParser.parse(url);
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
            if (tag.includes('%')) {
                tag = decodeURIComponent(tag);
            }
        
            let [base64, serverPart] = mainPart.split('@');
            let decodedParts = decodeBase64(base64).split(':');
            let method = decodedParts[0];
            let password = decodedParts.slice(1).join(':');
        
            // Match IPv6 address
            let match = serverPart.match(/\[([^\]]+)\]:(\d+)/);
            let server, server_port;
        
            if (match) {
                server = match[1];
                server_port = match[2];
            } else {
                [server, server_port] = serverPart.split(':');
            }
        
            return {
                "tag": tag,
                "type": 'shadowsocks',
                "server": server,
                "server_port": parseInt(server_port),
                "method": method,
                "password": password,
                "network": 'tcp',
                "tcp_fast_open": false
            }
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
          const transport = params.type !== 'tcp' ? createTransportConfig(params) : undefined;
      
          return {
            type: "vless",
            tag: name,
            server: host,
            server_port: port,
            uuid: uuid,
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
          const [uuid, serverInfo] = addressPart.split('@');
          const { host, port } = parseServerInfo(serverInfo);
      
          const tls = {
            enabled: true,
            server_name: params.sni,
            insecure: true,
            alpn: ["h3"],
          };

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
            password: uuid,
            tls: tls,
            obfs: obfs,
            up_mbps: 100,
            down_mbps: 100
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
            password: password || parsedURL.username,
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
            uuid: userinfo.split(':')[0],
            password: userinfo.split(':')[1],
            congestion_control: params.congestion_control,
            tls: tls,
            flow: params.flow ?? undefined
          };
        }
      }
      

      class HttpParser {
        static async parse(url) {
            try {
                const response = await fetch(url);
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
