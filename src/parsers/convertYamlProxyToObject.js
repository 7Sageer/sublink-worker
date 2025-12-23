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
                tcp_fast_open: !!p['fast-open'],
                udp: typeof p.udp !== 'undefined' ? !!p.udp : undefined,
                plugin: p.plugin,
                plugin_opts: p['plugin-opts']
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
                alter_id: typeof p.alterId !== 'undefined' ? parseInt(p.alterId) : 0,
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
        case 'anytls': {
            const tls = {
                enabled: true,
                server_name: p.sni,
                insecure: !!p['skip-cert-verify'],
                alpn: toArray(p.alpn)
            };
            if (p['client-fingerprint']) {
                tls.utls = {
                    enabled: true,
                    fingerprint: p['client-fingerprint']
                };
            }
            return {
                tag: name,
                type: 'anytls',
                server: p.server,
                server_port: parseInt(p.port),
                password: p.password,
                udp: !!p.udp,
                'idle-session-check-interval': p['idle-session-check-interval'],
                'idle-session-timeout': p['idle-session-timeout'],
                'min-idle-session': p['min-idle-session'],
                tls
            };
        }
        default:
            return null;
    }
}
