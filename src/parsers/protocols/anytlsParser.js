import { parseServerInfo, parseUrlParams, parseArray, parseBool, parseMaybeNumber } from '../../utils.js';

export function parseAnytls(url) {
    const { addressPart, params, name } = parseUrlParams(url);

    let host;
    let port;
    let password;

    if (addressPart.includes('@')) {
        const [pwd, serverInfo] = addressPart.split('@');
        const parsed = parseServerInfo(serverInfo);
        host = parsed.host;
        port = parsed.port;
        password = decodeURIComponent(pwd);
    } else {
        const parsed = parseServerInfo(addressPart);
        host = parsed.host;
        port = parsed.port;
        password = params.password || params.auth;
    }

    const tlsInsecure = parseBool(
        params['skip-cert-verify'] ?? params.insecure ?? params.allowInsecure ?? params.allow_insecure
    );

    const tls = {
        enabled: true,
        server_name: params.sni || params.host,
        ...(tlsInsecure !== undefined ? { insecure: tlsInsecure } : {})
    };

    const alpn = parseArray(params.alpn);
    if (alpn) {
        tls.alpn = alpn;
    }

    const fingerprint = params['client-fingerprint'] || params.client_fingerprint;
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
        password,
        ...(params.udp !== undefined ? { udp: parseBool(params.udp) } : {}),
        'idle-session-check-interval': parseMaybeNumber(
            params['idle-session-check-interval'] ?? params.idleSessionCheckInterval ?? params.idle_session_check_interval
        ),
        'idle-session-timeout': parseMaybeNumber(
            params['idle-session-timeout'] ?? params.idleSessionTimeout ?? params.idle_session_timeout
        ),
        'min-idle-session': parseMaybeNumber(
            params['min-idle-session'] ?? params.minIdleSession ?? params.min_idle_session
        ),
        tls
    };
}

