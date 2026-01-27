function buildTlsFromIR(tls) {
    if (!tls || typeof tls !== 'object') return undefined;
    const out = { ...tls };
    if (out.sni && !out.server_name) out.server_name = out.sni;
    if (out.server_name && !out.sni) out.sni = out.server_name;
    if (Array.isArray(out.alpn)) out.alpn = out.alpn.map(v => `${v}`.trim()).filter(Boolean);
    return out;
}

/**
 * Map an IR node into a Sing-Box outbound object.
 * Returns null when the IR node is invalid.
 *
 * NOTE: We intentionally DO NOT emit Clash-only fields like `udp`,
 * and we keep `alpn` only inside `tls` to match existing Sing-Box builder behavior.
 *
 * @param {object} ir
 * @returns {object|null}
 */
export function mapIRToSingboxOutbound(ir) {
    if (!ir || typeof ir !== 'object') return null;

    const tag = ir.tags?.[0] || ir.tag;
    if (!tag || !ir.kind || !ir.host || !ir.port) return null;

    const common = {
        tag,
        type: ir.kind,
        server: ir.host,
        server_port: ir.port,
        ...(ir.tcp_fast_open !== undefined ? { tcp_fast_open: ir.tcp_fast_open } : {}),
        ...(ir.network ? { network: ir.network } : {}),
        ...(ir.transport ? { transport: ir.transport } : {}),
        ...(ir.tls ? { tls: buildTlsFromIR(ir.tls) } : {})
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
                ...(ir.flow ? { flow: ir.flow } : {})
            };

        case 'trojan':
            return {
                ...common,
                password: ir.auth?.password,
                ...(ir.flow ? { flow: ir.flow } : {})
            };

        case 'shadowsocks':
            return {
                ...common,
                method: ir.auth?.method,
                password: ir.auth?.password,
                ...(ir.proto?.plugin ? { plugin: ir.proto.plugin } : {}),
                ...(ir.proto?.plugin_opts ? { plugin_opts: ir.proto.plugin_opts } : {})
            };

        case 'hysteria2':
            return {
                ...common,
                password: ir.auth?.password,
                ...(ir.proto?.hy2?.obfs ? { obfs: ir.proto.hy2.obfs } : {}),
                ...(ir.proto?.hy2?.auth ? { auth: ir.proto.hy2.auth } : {}),
                ...(ir.proto?.hy2?.up ? { up: ir.proto.hy2.up } : {}),
                ...(ir.proto?.hy2?.down ? { down: ir.proto.hy2.down } : {}),
                ...(ir.proto?.hy2?.recv_window_conn ? { recv_window_conn: ir.proto.hy2.recv_window_conn } : {}),
                ...(ir.proto?.hy2?.ports ? { ports: ir.proto.hy2.ports } : {}),
                ...(ir.proto?.hy2?.hop_interval !== undefined ? { hop_interval: ir.proto.hy2.hop_interval } : {}),
                ...(ir.proto?.hy2?.fast_open !== undefined ? { fast_open: ir.proto.hy2.fast_open } : {})
            };

        case 'tuic':
            return {
                ...common,
                uuid: ir.auth?.uuid,
                password: ir.auth?.password,
                ...(ir.proto?.tuic?.congestion_control ? { congestion_control: ir.proto.tuic.congestion_control } : {}),
                ...(ir.proto?.tuic?.udp_relay_mode ? { udp_relay_mode: ir.proto.tuic.udp_relay_mode } : {}),
                ...(ir.proto?.tuic?.zero_rtt !== undefined ? { zero_rtt: ir.proto.tuic.zero_rtt } : {}),
                ...(ir.proto?.tuic?.reduce_rtt !== undefined ? { reduce_rtt: ir.proto.tuic.reduce_rtt } : {}),
                ...(ir.proto?.tuic?.fast_open !== undefined ? { fast_open: ir.proto.tuic.fast_open } : {}),
                ...(ir.proto?.tuic?.disable_sni !== undefined ? { disable_sni: ir.proto.tuic.disable_sni } : {})
            };

        case 'anytls':
            return {
                ...common,
                password: ir.auth?.password,
                ...(ir.proto?.anytls ? { ...ir.proto.anytls } : {})
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

