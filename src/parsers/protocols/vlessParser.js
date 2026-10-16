import { parseServerInfo, parseUrlParams, createTlsConfig, createTransportConfig, parseBool } from '../../utils.js';

export function parseVless(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [uuid, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);

    const tls = createTlsConfig(params);
    // Prefer explicit fp; fall back to chrome for reality (common client default).
    if (tls.enabled) {
        const fingerprint = params.fp || params.fingerprint || (tls.reality ? 'chrome' : undefined);
        if (fingerprint) {
            tls.utls = {
                enabled: true,
                fingerprint
            };
        }
    }
    // type=tcp means no transport object; xhttp/ws/grpc/h2/http keep transport.
    const transport = params.type && params.type !== 'tcp'
        ? createTransportConfig(params)
        : undefined;

    // `udp` is a Clash-only flag; ClashConfigBuilder reads it, SingboxConfigBuilder strips it.
    const udp = params.udp !== undefined ? parseBool(params.udp) : undefined;

    // VLESS post-quantum encryption (e.g. mlkem768x25519plus.native.0rtt.<keys...>)
    // Must be preserved as-is for mihomo / xray clients.
    const encryption = params.encryption && params.encryption !== 'none'
        ? params.encryption
        : undefined;

    return {
        type: 'vless',
        tag: name,
        server: host,
        server_port: port,
        uuid: decodeURIComponent(uuid),
        tcp_fast_open: false,
        tls,
        transport,
        flow: params.flow ?? undefined,
        ...(encryption ? { encryption } : {}),
        ...(udp !== undefined ? { udp } : {})
    };
}
