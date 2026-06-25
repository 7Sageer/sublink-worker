import { parseServerInfo, parseUrlParams, parseArray, parseBool, parseMaybeNumber } from '../../utils.js';

export function parseAnytls(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [password, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);

    const tls = {
        enabled: true,
        server_name: params.sni || params.servername || params.host,
        insecure: parseBool(params['skip-cert-verify'] ?? params.insecure ?? params.allowInsecure ?? params.allow_insecure, false),
        alpn: parseArray(params.alpn)
    };

    const fingerprint = params['client-fingerprint'] || params.fingerprint || params.fp;
    if (fingerprint) {
        tls.utls = {
            enabled: true,
            fingerprint
        };
    }

    return {
        tag: name,
        type: 'anytls',
        server: host,
        server_port: port,
        password: decodeURIComponent(password || ''),
        udp: parseBool(params.udp),
        'idle-session-check-interval': parseMaybeNumber(params['idle-session-check-interval'] ?? params.idle_session_check_interval),
        'idle-session-timeout': parseMaybeNumber(params['idle-session-timeout'] ?? params.idle_session_timeout),
        'min-idle-session': parseMaybeNumber(params['min-idle-session'] ?? params.min_idle_session),
        tls
    };
}
