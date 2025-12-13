import { parseServerInfo, parseUrlParams, createTlsConfig, parseMaybeNumber, parseArray, parseBool } from '../../utils.js';

export function parseHysteria2(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    let host;
    let port;
    let password = null;

    if (addressPart.includes('@')) {
        const [uuid, serverInfo] = addressPart.split('@');
        const parsed = parseServerInfo(serverInfo);
        host = parsed.host;
        port = parsed.port;
        password = decodeURIComponent(uuid);
    } else {
        const parsed = parseServerInfo(addressPart);
        host = parsed.host;
        port = parsed.port;
        password = params.auth;
    }

    const tls = createTlsConfig(params);
    const obfs = {};
    if (params['obfs-password']) {
        obfs.type = params.obfs;
        obfs.password = params['obfs-password'];
    }

    const hopInterval = parseMaybeNumber(params['hop-interval']);

    return {
        tag: name,
        type: 'hysteria2',
        server: host,
        server_port: port,
        password: password,
        tls,
        obfs: Object.keys(obfs).length > 0 ? obfs : undefined,
        auth: params.auth,
        recv_window_conn: params.recv_window_conn,
        up: params.up ?? (params.upmbps ? parseMaybeNumber(params.upmbps) : undefined),
        down: params.down ?? (params.downmbps ? parseMaybeNumber(params.downmbps) : undefined),
        ports: params.ports,
        hop_interval: hopInterval,
        alpn: parseArray(params.alpn),
        fast_open: parseBool(params['fast-open'])
    };
}
