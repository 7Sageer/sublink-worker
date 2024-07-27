import { parseServerInfo, parseUrlParams, createTlsConfig, createTransportConfig } from './utils.js';


export class ProxyParser {
	static parse(url) {
		const type = url.split('://')[0];
		switch(type) {
			case 'ss': return new ShadowsocksParser().parse(url);
			case 'vmess': return new VmessParser().parse(url);
			case 'vless': return new VlessParser().parse(url);
            case 'hysteria2': return new Hysteria2Parser().parse(url);
		}
	}
	}

	class ShadowsocksParser {
		parse(url) {
            let parts = url.replace('ss://', '').split('#');
            let mainPart = parts[0];
            let tag = parts[1];
        
            let [base64, serverPart] = mainPart.split('@');
            let [method, password] = atob(base64).split(':');
        
            // 匹配 IPv6 地址
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
            let vmessConfig = JSON.parse(atob(base64))
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
                "security": vmessConfig.scy,
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
      
          return {
            tag: name,
            type: "hysteria2",
            server: host,
            server_port: port,
            password: uuid,
            tls: tls,
            up_mbps: 100,
            down_mbps: 100
          };
        }
      }
