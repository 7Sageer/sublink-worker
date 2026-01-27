function mapTransportToClashOpts(transport, opts = {}) {
    if (!transport || typeof transport !== 'object') return {};
    const allowHttp = opts.allowHttp === true;
    const allowH2 = opts.allowH2 === true;

    if (transport.type === 'ws') {
        return {
            network: 'ws',
            'ws-opts': {
                path: transport.path,
                headers: transport.headers
            }
        };
    }

    if (transport.type === 'http') {
        if (!allowHttp) return { network: 'http' };
        const opts = {
            method: transport.method || 'GET',
            path: Array.isArray(transport.path) ? transport.path : [transport.path || '/'],
        };
        if (transport.headers && Object.keys(transport.headers).length > 0) {
            opts.headers = transport.headers;
        }
        return {
            network: 'http',
            'http-opts': opts
        };
    }

    if (transport.type === 'grpc') {
        return {
            network: 'grpc',
            'grpc-opts': {
                'grpc-service-name': transport.service_name
            }
        };
    }

    if (transport.type === 'h2') {
        if (!allowH2) return { network: 'h2' };
        return {
            network: 'h2',
            'h2-opts': {
                path: transport.path,
                host: transport.host
            }
        };
    }

    return { network: transport.type };
}

/**
 * Map an IR node into a Clash proxy object.
 * Returns null when the protocol is not supported by our Clash YAML output.
 *
 * @param {object} ir
 * @returns {object|null}
 */
export function mapIRToClashProxy(ir) {
    if (!ir || typeof ir !== 'object') return null;

    const name = ir.tags?.[0] || ir.tag;
    if (!name || !ir.kind || !ir.host || !ir.port) return null;

    const tls = ir.tls || {};
    const transport = ir.transport;

    switch (ir.kind) {
        case 'shadowsocks': {
            const method = ir.auth?.method;
            const password = ir.auth?.password;
            if (!method || !password) return null;
            return {
                name,
                type: 'ss',
                server: ir.host,
                port: ir.port,
                cipher: method,
                password,
                ...(typeof ir.udp !== 'undefined' ? { udp: ir.udp } : {}),
                ...(ir.proto?.plugin ? { plugin: ir.proto.plugin } : {}),
                ...(ir.proto?.plugin_opts ? { 'plugin-opts': ir.proto.plugin_opts } : {})
            };
        }

        case 'vmess': {
            const uuid = ir.auth?.uuid;
            if (!uuid) return null;
            const transportOpts = mapTransportToClashOpts(transport, { allowHttp: true, allowH2: true });
            const network = transportOpts.network || transport?.type || ir.network || 'tcp';
            return {
                name,
                type: 'vmess',
                server: ir.host,
                port: ir.port,
                uuid,
                alterId: ir.ext?.clash?.alterId ?? 0,
                cipher: ir.auth?.method,
                tls: !!tls.enabled,
                servername: tls.server_name || '',
                'skip-cert-verify': !!tls.insecure,
                network,
                ...transportOpts,
            };
        }

        case 'vless': {
            const uuid = ir.auth?.uuid;
            if (!uuid) return null;
            const transportOpts = mapTransportToClashOpts(transport, { allowHttp: false, allowH2: false });
            return {
                name,
                type: 'vless',
                server: ir.host,
                port: ir.port,
                uuid,
                cipher: ir.auth?.method,
                tls: !!tls.enabled,
                'client-fingerprint': tls.utls?.fingerprint,
                servername: tls.server_name || '',
                network: transport?.type || 'tcp',
                ...(transport?.type === 'ws' ? { 'ws-opts': transportOpts['ws-opts'] } : {}),
                ...(transport?.type === 'grpc' ? { 'grpc-opts': transportOpts['grpc-opts'] } : {}),
                'reality-opts': tls.reality?.enabled
                    ? {
                        'public-key': tls.reality.public_key ?? tls.reality.publicKey,
                        'short-id': tls.reality.short_id ?? tls.reality.shortId,
                    }
                    : undefined,
                tfo: ir.tcp_fast_open,
                'skip-cert-verify': !!tls.insecure,
                ...(typeof ir.udp !== 'undefined' ? { udp: ir.udp } : {}),
                ...(Array.isArray(tls.alpn) ? { alpn: tls.alpn } : {}),
                ...(ir.packet_encoding ? { 'packet-encoding': ir.packet_encoding } : {}),
                flow: ir.flow ?? undefined,
            };
        }

        case 'hysteria2': {
            const password = ir.auth?.password;
            if (!password) return null;
            const obfs = ir.proto?.hy2?.obfs;
            return {
                name,
                type: 'hysteria2',
                server: ir.host,
                port: ir.port,
                ...(ir.proto?.hy2?.ports ? { ports: ir.proto.hy2.ports } : {}),
                obfs: obfs?.type,
                'obfs-password': obfs?.password,
                password,
                auth: ir.proto?.hy2?.auth,
                up: ir.proto?.hy2?.up,
                down: ir.proto?.hy2?.down,
                'recv-window-conn': ir.proto?.hy2?.recv_window_conn,
                sni: tls.server_name || '',
                'skip-cert-verify': !!tls.insecure,
                ...(ir.proto?.hy2?.hop_interval !== undefined ? { 'hop-interval': ir.proto.hy2.hop_interval } : {}),
                ...(Array.isArray(tls.alpn) ? { alpn: tls.alpn } : {}),
                ...(ir.proto?.hy2?.fast_open !== undefined ? { 'fast-open': ir.proto.hy2.fast_open } : {}),
            };
        }

        case 'trojan': {
            const password = ir.auth?.password;
            if (!password) return null;
            const transportOpts = mapTransportToClashOpts(transport, { allowHttp: false, allowH2: false });
            return {
                name,
                type: 'trojan',
                server: ir.host,
                port: ir.port,
                password,
                cipher: ir.auth?.method,
                tls: !!tls.enabled,
                'client-fingerprint': tls.utls?.fingerprint,
                sni: tls.server_name || '',
                network: transport?.type || 'tcp',
                ...(transport?.type === 'ws' ? { 'ws-opts': transportOpts['ws-opts'] } : {}),
                ...(transport?.type === 'grpc' ? { 'grpc-opts': transportOpts['grpc-opts'] } : {}),
                'reality-opts': tls.reality?.enabled
                    ? {
                        'public-key': tls.reality.public_key ?? tls.reality.publicKey,
                        'short-id': tls.reality.short_id ?? tls.reality.shortId,
                    }
                    : undefined,
                tfo: ir.tcp_fast_open,
                'skip-cert-verify': !!tls.insecure,
                ...(Array.isArray(tls.alpn) ? { alpn: tls.alpn } : {}),
                flow: ir.flow ?? undefined,
            };
        }

        case 'tuic': {
            const uuid = ir.auth?.uuid;
            const password = ir.auth?.password;
            if (!uuid || !password) return null;
            return {
                name,
                type: 'tuic',
                server: ir.host,
                port: ir.port,
                uuid,
                password,
                'congestion-controller': ir.proto?.tuic?.congestion_control,
                'skip-cert-verify': !!tls.insecure,
                ...(ir.proto?.tuic?.disable_sni !== undefined ? { 'disable-sni': ir.proto.tuic.disable_sni } : {}),
                ...(Array.isArray(tls.alpn) ? { alpn: tls.alpn } : {}),
                sni: tls.server_name,
                'udp-relay-mode': ir.proto?.tuic?.udp_relay_mode || 'native',
                ...(ir.proto?.tuic?.zero_rtt !== undefined ? { 'zero-rtt': ir.proto.tuic.zero_rtt } : {}),
                ...(ir.proto?.tuic?.reduce_rtt !== undefined ? { 'reduce-rtt': ir.proto.tuic.reduce_rtt } : {}),
                ...(ir.proto?.tuic?.fast_open !== undefined ? { 'fast-open': ir.proto.tuic.fast_open } : {}),
            };
        }

        case 'anytls': {
            const password = ir.auth?.password;
            if (!password) return null;
            return {
                name,
                type: 'anytls',
                server: ir.host,
                port: ir.port,
                password,
                ...(ir.udp !== undefined ? { udp: ir.udp } : {}),
                ...(tls.utls?.fingerprint ? { 'client-fingerprint': tls.utls.fingerprint } : {}),
                ...(tls.server_name ? { sni: tls.server_name } : {}),
                ...(tls.insecure !== undefined ? { 'skip-cert-verify': !!tls.insecure } : {}),
                ...(Array.isArray(tls.alpn) ? { alpn: tls.alpn } : {}),
                ...(ir.proto?.anytls?.idle_session_check_interval !== undefined ? { 'idle-session-check-interval': ir.proto.anytls.idle_session_check_interval } : {}),
                ...(ir.proto?.anytls?.idle_session_timeout !== undefined ? { 'idle-session-timeout': ir.proto.anytls.idle_session_timeout } : {}),
                ...(ir.proto?.anytls?.min_idle_session !== undefined ? { 'min-idle-session': ir.proto.anytls.min_idle_session } : {}),
            };
        }

        default:
            return null;
    }
}
