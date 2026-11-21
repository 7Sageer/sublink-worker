import { parseServerInfo, parseUrlParams, createTlsConfig, createTransportConfig, createUtlsConfig, parseBool } from '../../utils.js';

export function parseVless(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [uuid, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);

    const tls = createTlsConfig(params);
    // Reality needs a uTLS fingerprint, so fall back to chrome when the link has none.
    const utls = tls.enabled ? createUtlsConfig(params.fp || (tls.reality ? 'chrome' : undefined)) : undefined;
    if (utls) tls.utls = utls;
    const transport = createTransportConfig(params);

    // `udp` is a Clash-only flag; ClashConfigBuilder reads it, SingboxConfigBuilder strips it.
    const udp = params.udp !== undefined ? parseBool(params.udp) : undefined;

    // VLESS post-quantum encryption (mlkem768x25519plus...); the server rejects
    // clients that omit it, so it must survive conversion verbatim.
    const encryption = params.encryption && params.encryption !== 'none' ? params.encryption : undefined;

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
