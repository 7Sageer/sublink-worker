import { InvalidPayloadError } from '../services/errors.js';
import { IR_VERSION, isPlainObject, normalizeKind, sanitizeTags } from './contract.js';

function normalizeTls(tls) {
    if (!isPlainObject(tls)) return undefined;
    const copy = { ...tls };
    if (copy.sni && !copy.server_name) copy.server_name = copy.sni;
    if (copy.server_name && !copy.sni) copy.sni = copy.server_name;
    if (Array.isArray(copy.alpn)) copy.alpn = copy.alpn.map(v => `${v}`.trim()).filter(Boolean);
    return copy;
}

/**
 * Convert current internal proxy objects into a unified IR node.
 * By default, this is tolerant: it returns null for invalid nodes.
 *
 * @param {object} proxy
 * @param {{ strict?: boolean }} [opts]
 * @returns {object|null}
 */
export function normalizeLegacyProxyToIR(proxy, opts = {}) {
    const strict = !!opts.strict;

    try {
        if (!isPlainObject(proxy)) {
            throw new InvalidPayloadError('node: must be an object');
        }

        const kind = normalizeKind(proxy.kind ?? proxy.type);
        if (!kind) {
            throw new InvalidPayloadError('kind: is required');
        }

        const host = `${proxy.host ?? proxy.server ?? proxy.address ?? ''}`.trim();
        if (!host) {
            throw new InvalidPayloadError('host: is required');
        }

        const portValue = proxy.port ?? proxy.server_port;
        const port = Number(portValue);
        if (!Number.isFinite(port) || port <= 0) {
            throw new InvalidPayloadError('port: must be a positive number');
        }

        const tags = sanitizeTags(proxy.tags ?? proxy.tag ?? proxy.name);
        if (tags.length === 0) {
            throw new InvalidPayloadError('tag: tag or tags is required');
        }

        const ir = {
            version: IR_VERSION,
            kind,
            host,
            port,
            tags,
            udp: proxy.udp,
            network: proxy.network,
            transport: proxy.transport,
            tls: normalizeTls(proxy.tls),
            ext: proxy.ext ? { ...proxy.ext } : undefined
        };

        switch (kind) {
            case 'vmess': {
                const uuid = proxy.uuid ?? proxy.auth?.uuid;
                if (!uuid) throw new InvalidPayloadError('uuid: is required');
                ir.auth = { uuid, method: proxy.security ?? proxy.auth?.method ?? 'auto' };
                if (proxy.alter_id != null) ir.ext = { ...(ir.ext || {}), clash: { ...(ir.ext?.clash || {}), alterId: proxy.alter_id } };
                break;
            }
            case 'vless': {
                const uuid = proxy.uuid ?? proxy.auth?.uuid;
                if (!uuid) throw new InvalidPayloadError('uuid: is required');
                ir.auth = { uuid };
                if (proxy.flow) ir.flow = proxy.flow;
                if (proxy.packet_encoding || proxy.packetEncoding) ir.packet_encoding = proxy.packet_encoding ?? proxy.packetEncoding;
                break;
            }
            case 'trojan': {
                const password = proxy.password ?? proxy.auth?.password;
                if (!password) throw new InvalidPayloadError('password: is required');
                ir.auth = { password };
                if (proxy.flow) ir.flow = proxy.flow;
                break;
            }
            case 'shadowsocks': {
                const password = proxy.password ?? proxy.auth?.password;
                const method = proxy.method ?? proxy.auth?.method;
                if (!password) throw new InvalidPayloadError('password: is required');
                if (!method) throw new InvalidPayloadError('method: is required');
                ir.auth = { password, method };
                if (proxy.plugin) ir.proto = { ...(ir.proto || {}), plugin: proxy.plugin };
                if (proxy.plugin_opts) ir.proto = { ...(ir.proto || {}), plugin_opts: proxy.plugin_opts };
                break;
            }
            case 'hysteria2': {
                const password = proxy.password ?? proxy.auth?.password;
                if (!password) throw new InvalidPayloadError('password: is required');
                ir.auth = { password };
                ir.proto = {
                    ...(ir.proto || {}),
                    hy2: {
                        obfs: proxy.obfs,
                        auth: proxy.auth,
                        up: proxy.up,
                        down: proxy.down,
                        recv_window_conn: proxy.recv_window_conn,
                        ports: proxy.ports,
                        hop_interval: proxy.hop_interval,
                        fast_open: proxy.fast_open
                    }
                };
                break;
            }
            case 'tuic': {
                const uuid = proxy.uuid ?? proxy.auth?.uuid;
                const password = proxy.password ?? proxy.auth?.password;
                if (!uuid) throw new InvalidPayloadError('uuid: is required');
                if (!password) throw new InvalidPayloadError('password: is required');
                ir.auth = { uuid, password };
                ir.proto = {
                    ...(ir.proto || {}),
                    tuic: {
                        congestion_control: proxy.congestion_control,
                        udp_relay_mode: proxy.udp_relay_mode,
                        zero_rtt: proxy.zero_rtt,
                        reduce_rtt: proxy.reduce_rtt,
                        fast_open: proxy.fast_open,
                        disable_sni: proxy.disable_sni
                    }
                };
                break;
            }
            case 'anytls': {
                const password = proxy.password ?? proxy.auth?.password;
                if (!password) throw new InvalidPayloadError('password: is required');
                ir.auth = { password };
                ir.proto = {
                    ...(ir.proto || {}),
                    anytls: {
                        idle_session_check_interval: proxy['idle-session-check-interval'],
                        idle_session_timeout: proxy['idle-session-timeout'],
                        min_idle_session: proxy['min-idle-session']
                    }
                };
                break;
            }
            case 'http':
            case 'https': {
                ir.auth = proxy.username || proxy.password
                    ? { username: proxy.username, password: proxy.password }
                    : undefined;
                break;
            }
            default:
                // Keep unknown kinds as-is in IR to avoid breaking older behavior.
                break;
        }

        return ir;
    } catch (err) {
        if (strict) throw err;
        return null;
    }
}

