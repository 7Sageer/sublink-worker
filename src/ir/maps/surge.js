/**
 * Map an IR node into a Surge proxy line.
 *
 * @param {object} ir
 * @returns {string}
 */
export function mapIRToSurgeProxyLine(ir) {
    if (!ir || typeof ir !== 'object') return '# Invalid node';

    const tag = ir.tags?.[0] || ir.tag;
    const host = ir.host;
    const port = ir.port;
    if (!tag || !host || !port) return '# Invalid node';

    const tls = ir.tls;
    const transport = ir.transport;

    switch (ir.kind) {
        case 'shadowsocks': {
            const method = ir.auth?.method;
            const password = ir.auth?.password;
            if (!method || !password) return `# ${tag} - Invalid shadowsocks node`;
            return `${tag} = ss, ${host}, ${port}, encrypt-method=${method}, password=${password}`;
        }
        case 'vmess': {
            const uuid = ir.auth?.uuid;
            if (!uuid) return `# ${tag} - Invalid vmess node`;
            const alterId = ir.ext?.clash?.alterId;

            let line = `${tag} = vmess, ${host}, ${port}, username=${uuid}`;
            if (alterId === 0) {
                line += ', vmess-aead=true';
            }

            if (tls?.enabled) {
                line += ', tls=true';
                if (tls.server_name) line += `, sni=${tls.server_name}`;
                if (tls.insecure) line += ', skip-cert-verify=true';
                if (Array.isArray(tls.alpn) && tls.alpn.length > 0) line += `, alpn=${tls.alpn.join(',')}`;
            }

            if (transport?.type === 'ws') {
                line += `, ws=true, ws-path=${transport.path}`;
                const hostHeader = transport.headers?.host || transport.headers?.Host;
                if (hostHeader) {
                    line += `, ws-headers=Host:${hostHeader}`;
                }
            } else if (transport?.type === 'grpc') {
                if (transport.service_name) line += `, grpc-service-name=${transport.service_name}`;
            }

            return line;
        }
        case 'trojan': {
            const password = ir.auth?.password;
            if (!password) return `# ${tag} - Invalid trojan node`;

            let line = `${tag} = trojan, ${host}, ${port}, password=${password}`;

            if (tls?.server_name) line += `, sni=${tls.server_name}`;
            if (tls?.insecure) line += ', skip-cert-verify=true';
            if (Array.isArray(tls?.alpn) && tls.alpn.length > 0) line += `, alpn=${tls.alpn.join(',')}`;

            if (transport?.type === 'ws') {
                line += `, ws=true, ws-path=${transport.path}`;
                const hostHeader = transport.headers?.host || transport.headers?.Host;
                if (hostHeader) {
                    line += `, ws-headers=Host:${hostHeader}`;
                }
            } else if (transport?.type === 'grpc') {
                if (transport.service_name) line += `, grpc-service-name=${transport.service_name}`;
            }

            return line;
        }
        case 'hysteria2': {
            const password = ir.auth?.password;
            if (!password) return `# ${tag} - Invalid hysteria2 node`;

            let line = `${tag} = hysteria2, ${host}, ${port}, password=${password}`;

            if (tls?.server_name) line += `, sni=${tls.server_name}`;
            if (tls?.insecure) line += ', skip-cert-verify=true';
            if (Array.isArray(tls?.alpn) && tls.alpn.length > 0) line += `, alpn=${tls.alpn.join(',')}`;

            return line;
        }
        case 'tuic': {
            const uuid = ir.auth?.uuid;
            const password = ir.auth?.password;
            if (!uuid || !password) return `# ${tag} - Invalid tuic node`;

            let line = `${tag} = tuic, ${host}, ${port}, password=${password}, uuid=${uuid}`;

            if (tls?.server_name) line += `, sni=${tls.server_name}`;
            if (Array.isArray(tls?.alpn) && tls.alpn.length > 0) line += `, alpn=${tls.alpn.join(',')}`;
            if (tls?.insecure) line += ', skip-cert-verify=true';

            const congestion = ir.proto?.tuic?.congestion_control;
            if (congestion) line += `, congestion-controller=${congestion}`;

            const udpRelayMode = ir.proto?.tuic?.udp_relay_mode;
            if (udpRelayMode) line += `, udp-relay-mode=${udpRelayMode}`;

            return line;
        }
        default:
            return `# ${tag} - Unsupported proxy type: ${ir.kind}`;
    }
}

