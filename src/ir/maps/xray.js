function buildStreamSettingsFromIR(ir) {
    const transport = ir.transport;
    const tls = ir.tls;

    const network = transport?.type || ir.network || 'tcp';
    const streamSettings = { network };

    if (tls?.enabled) {
        const serverName = tls.server_name || tls.sni;

        if (tls.reality?.enabled || tls.reality) {
            streamSettings.security = 'reality';
            streamSettings.realitySettings = {
                publicKey: tls.reality.public_key ?? tls.reality.publicKey,
                shortId: tls.reality.short_id ?? tls.reality.shortId,
                serverName,
                ...(tls.utls?.fingerprint ? { fingerprint: tls.utls.fingerprint } : {}),
            };
        } else {
            streamSettings.security = 'tls';
            streamSettings.tlsSettings = {
                serverName,
                allowInsecure: !!tls.insecure,
                ...(Array.isArray(tls.alpn) ? { alpn: tls.alpn } : {}),
                ...(tls.utls?.fingerprint ? { fingerprint: tls.utls.fingerprint } : {}),
            };
        }
    }

    if (network === 'ws') {
        streamSettings.wsSettings = {
            path: transport?.path,
            headers: transport?.headers
        };
    } else if (network === 'grpc') {
        streamSettings.grpcSettings = {
            serviceName: transport?.service_name
        };
    } else if (network === 'http') {
        streamSettings.httpSettings = {
            host: transport?.headers?.host ? [transport.headers.host] : undefined,
            path: Array.isArray(transport?.path) ? transport.path : (transport?.path ? [transport.path] : undefined),
            method: transport?.method
        };
    } else if (network === 'h2') {
        streamSettings.httpSettings = {
            host: Array.isArray(transport?.host) ? transport.host : (transport?.host ? [transport.host] : undefined),
            path: transport?.path ? [transport.path] : undefined
        };
    }

    return streamSettings;
}

/**
 * Map an IR node into an Xray outbound.
 * Returns null when the protocol is not supported by the Xray JSON output.
 *
 * @param {object} ir
 * @returns {object|null}
 */
export function mapIRToXray(ir) {
    if (!ir || typeof ir !== 'object') return null;

    const tag = ir.tags?.[0] || ir.tag;
    if (!tag || !ir.kind || !ir.host || !ir.port) return null;

    switch (ir.kind) {
        case 'vless': {
            const uuid = ir.auth?.uuid;
            if (!uuid) return null;
            return {
                tag,
                protocol: 'vless',
                settings: {
                    vnext: [
                        {
                            address: ir.host,
                            port: ir.port,
                            users: [
                                {
                                    id: uuid,
                                    encryption: 'none',
                                    ...(ir.flow ? { flow: ir.flow } : {})
                                }
                            ]
                        }
                    ]
                },
                streamSettings: buildStreamSettingsFromIR(ir)
            };
        }
        case 'vmess': {
            const uuid = ir.auth?.uuid;
            if (!uuid) return null;
            const alterId = ir.ext?.clash?.alterId ?? 0;
            return {
                tag,
                protocol: 'vmess',
                settings: {
                    vnext: [
                        {
                            address: ir.host,
                            port: ir.port,
                            users: [
                                {
                                    id: uuid,
                                    alterId,
                                    security: ir.auth?.method ?? 'auto'
                                }
                            ]
                        }
                    ]
                },
                streamSettings: buildStreamSettingsFromIR(ir)
            };
        }
        case 'trojan': {
            const password = ir.auth?.password;
            if (!password) return null;
            return {
                tag,
                protocol: 'trojan',
                settings: {
                    servers: [
                        {
                            address: ir.host,
                            port: ir.port,
                            password,
                            ...(ir.flow ? { flow: ir.flow } : {})
                        }
                    ]
                },
                streamSettings: buildStreamSettingsFromIR(ir)
            };
        }
        case 'shadowsocks': {
            const password = ir.auth?.password;
            const method = ir.auth?.method;
            if (!password || !method) return null;
            return {
                tag,
                protocol: 'shadowsocks',
                settings: {
                    servers: [
                        {
                            address: ir.host,
                            port: ir.port,
                            method,
                            password
                        }
                    ]
                }
            };
        }
        default:
            return null;
    }
}

