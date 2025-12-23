/**
 * Parse Surge proxy line format and convert to internal (Sing-Box) format
 * 
 * Surge formats:
 * - SS: ProxyName = ss, server, port, encrypt-method=cipher, password=xxx
 * - VMess: ProxyName = vmess, server, port, username=uuid, ...
 * - Trojan: ProxyName = trojan, server, port, password=xxx, ...
 * - TUIC: ProxyName = tuic, server, port, uuid=xxx, password=xxx, ...
 * - Hysteria2: ProxyName = hysteria2, server, port, password=xxx, ...
 */

/**
 * Parse key=value parameters from a Surge proxy line
 * @param {string[]} parts - Array of parameter strings
 * @returns {object} - Parsed parameters
 */
function parseParams(parts) {
    const params = {};
    for (const part of parts) {
        const trimmed = part.trim();
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim();
            params[key] = value;
        }
    }
    return params;
}

/**
 * Parse boolean value from Surge format (case-insensitive)
 * @param {string} value 
 * @returns {boolean}
 */
function parseBool(value) {
    if (value === undefined || value === null) return false;
    if (value === true || value === 1) return true;
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' || lower === 'yes';
    }
    return false;
}

/**
 * Convert a Surge proxy line to internal (Sing-Box) format
 * @param {string} line - The Surge proxy line
 * @returns {object|null} - Parsed proxy object or null if invalid
 */
export function convertSurgeProxyToObject(line) {
    if (!line || typeof line !== 'string') return null;

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
        return null;
    }

    // Split by first '=' to get name and rest
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return null;

    const tag = trimmed.slice(0, eqIndex).trim();
    const rest = trimmed.slice(eqIndex + 1).trim();

    // Split by comma to get parts
    const parts = rest.split(',').map(p => p.trim());
    if (parts.length < 3) return null;

    const type = parts[0].toLowerCase();
    const server = parts[1];
    const port = parseInt(parts[2]);

    if (!server || isNaN(port)) return null;

    // Parse remaining parameters
    const params = parseParams(parts.slice(3));

    // Build TLS config if needed
    const buildTls = () => {
        if (!parseBool(params.tls)) return undefined;
        return {
            enabled: true,
            server_name: params.sni || params['server-name'] || server,
            insecure: parseBool(params['skip-cert-verify']),
            alpn: params.alpn ? params.alpn.split(',').map(a => a.trim()) : undefined
        };
    };

    // Build transport config
    const buildTransport = () => {
        const wsPath = params['ws-path'] || params.path;
        if (params.ws === 'true' || wsPath) {
            return {
                type: 'ws',
                path: wsPath,
                headers: params['ws-headers'] ? { host: params['ws-headers'] } : undefined
            };
        }
        return undefined;
    };

    switch (type) {
        case 'ss':
        case 'shadowsocks':
            return {
                tag,
                type: 'shadowsocks',
                server,
                server_port: port,
                method: params['encrypt-method'] || params.method || params.cipher,
                password: params.password,
                network: 'tcp',
                tcp_fast_open: parseBool(params.tfo || params['tcp-fast-open'])
            };

        case 'vmess':
            return {
                tag,
                type: 'vmess',
                server,
                server_port: port,
                uuid: params.username || params.uuid,
                alter_id: parseInt(params.alterId) || 0,
                security: params.cipher || params.security || 'auto',
                network: 'tcp',
                tcp_fast_open: parseBool(params.tfo || params['tcp-fast-open']),
                tls: buildTls(),
                transport: buildTransport()
            };

        case 'trojan':
            return {
                tag,
                type: 'trojan',
                server,
                server_port: port,
                password: params.password,
                network: 'tcp',
                tcp_fast_open: parseBool(params.tfo || params['tcp-fast-open']),
                tls: {
                    enabled: true,
                    server_name: params.sni || params['server-name'] || server,
                    insecure: parseBool(params['skip-cert-verify']),
                    alpn: params.alpn ? params.alpn.split(',').map(a => a.trim()) : undefined
                },
                transport: buildTransport()
            };

        case 'tuic':
            return {
                tag,
                type: 'tuic',
                server,
                server_port: port,
                uuid: params.uuid,
                password: params.password,
                congestion_control: params['congestion-controller'] || params.congestion_control,
                udp_relay_mode: params['udp-relay-mode'],
                tls: {
                    enabled: true,
                    server_name: params.sni || params['server-name'] || server,
                    insecure: parseBool(params['skip-cert-verify']),
                    alpn: params.alpn ? params.alpn.split(',').map(a => a.trim()) : undefined
                }
            };

        case 'hysteria2':
        case 'hy2':
            return {
                tag,
                type: 'hysteria2',
                server,
                server_port: port,
                password: params.password,
                tls: {
                    enabled: true,
                    server_name: params.sni || params['server-name'] || server,
                    insecure: parseBool(params['skip-cert-verify']),
                    alpn: params.alpn ? params.alpn.split(',').map(a => a.trim()) : undefined
                },
                obfs: params['obfs-password'] ? {
                    type: params.obfs || 'salamander',
                    password: params['obfs-password']
                } : undefined
            };

        case 'http':
        case 'https':
            // Skip HTTP/HTTPS proxy types
            return null;

        case 'direct':
        case 'reject':
        case 'reject-tinygif':
            // Skip special proxy types
            return null;

        default:
            console.warn(`Unsupported Surge proxy type: ${type}`);
            return null;
    }
}
