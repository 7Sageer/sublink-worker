import { IR_VERSION } from './contract.js';

function normalizeTlsToLegacy(tls) {
    if (!tls || typeof tls !== 'object') return undefined;
    const out = { ...tls };
    if (out.sni && !out.server_name) out.server_name = out.sni;
    if (out.server_name && !out.sni) out.sni = out.server_name;
    return out;
}

/**
 * Convert IR nodes back into the current internal proxy object shape consumed by builders.
 * This allows us to introduce IR as a contract without forcing a full builder migration.
 *
 * @param {object} ir
 * @returns {object|null}
 */
export function convertIRToLegacyProxy(ir) {
    if (!ir || typeof ir !== 'object') return null;
    if (ir.version && ir.version !== IR_VERSION) {
        // Keep forwards-compat: still attempt a best-effort conversion
    }

    const tag = ir.tags?.[0] || ir.tag;
    if (!tag || !ir.kind || !ir.host || !ir.port) return null;

    const common = {
        tag,
        type: ir.kind,
        server: ir.host,
        server_port: ir.port,
        ...(ir.udp !== undefined ? { udp: ir.udp } : {}),
        ...(ir.network ? { network: ir.network } : {}),
        ...(ir.tcp_fast_open !== undefined ? { tcp_fast_open: ir.tcp_fast_open } : {}),
        ...(ir.transport ? { transport: ir.transport } : {}),
        ...(ir.tls ? { tls: normalizeTlsToLegacy(ir.tls) } : {}),
        ...(Array.isArray(ir.tls?.alpn) ? { alpn: [...ir.tls.alpn] } : {}),
        ...(ir.ext ? { ext: { ...ir.ext } } : {})
    };

    switch (ir.kind) {
        case 'vmess':
            return {
                ...common,
                uuid: ir.auth?.uuid,
                security: ir.auth?.method ?? 'auto',
                ...(ir.ext?.clash?.alterId !== undefined ? { alter_id: ir.ext.clash.alterId } : {})
            };
        case 'vless':
            return {
                ...common,
                uuid: ir.auth?.uuid,
                ...(ir.flow ? { flow: ir.flow } : {}),
                ...((ir.packet_encoding || ir.packetEncoding) ? { packet_encoding: ir.packet_encoding || ir.packetEncoding } : {})
            };
        case 'trojan':
            return { ...common, password: ir.auth?.password, ...(ir.flow ? { flow: ir.flow } : {}) };
        case 'shadowsocks':
            return { ...common, password: ir.auth?.password, method: ir.auth?.method, ...(ir.proto?.plugin ? { plugin: ir.proto.plugin } : {}), ...(ir.proto?.plugin_opts ? { plugin_opts: ir.proto.plugin_opts } : {}) };
        case 'hysteria2':
            return {
                ...common,
                password: ir.auth?.password,
                obfs: ir.proto?.hy2?.obfs,
                auth: ir.proto?.hy2?.auth,
                up: ir.proto?.hy2?.up,
                down: ir.proto?.hy2?.down,
                recv_window_conn: ir.proto?.hy2?.recv_window_conn,
                ports: ir.proto?.hy2?.ports,
                hop_interval: ir.proto?.hy2?.hop_interval,
                fast_open: ir.proto?.hy2?.fast_open
            };
        case 'tuic':
            return {
                ...common,
                uuid: ir.auth?.uuid,
                password: ir.auth?.password,
                congestion_control: ir.proto?.tuic?.congestion_control,
                udp_relay_mode: ir.proto?.tuic?.udp_relay_mode,
                zero_rtt: ir.proto?.tuic?.zero_rtt,
                reduce_rtt: ir.proto?.tuic?.reduce_rtt,
                fast_open: ir.proto?.tuic?.fast_open,
                disable_sni: ir.proto?.tuic?.disable_sni
            };
        case 'anytls':
            return {
                ...common,
                password: ir.auth?.password,
                ...(ir.proto?.anytls?.idle_session_check_interval !== undefined
                    ? { 'idle-session-check-interval': ir.proto.anytls.idle_session_check_interval }
                    : {}),
                ...(ir.proto?.anytls?.idle_session_timeout !== undefined
                    ? { 'idle-session-timeout': ir.proto.anytls.idle_session_timeout }
                    : {}),
                ...(ir.proto?.anytls?.min_idle_session !== undefined
                    ? { 'min-idle-session': ir.proto.anytls.min_idle_session }
                    : {})
            };
        case 'http':
        case 'https':
            return {
                ...common,
                username: ir.auth?.username,
                password: ir.auth?.password
            };
        default:
            return common;
    }
}
