import { parseArray, parseBool, parseMaybeNumber } from '../../utils.js';

function getFirstParam(searchParams, keys) {
    for (const key of keys) {
        if (searchParams.has(key)) {
            return searchParams.get(key);
        }
    }
    return undefined;
}

function parseOptionalNumber(value) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return undefined;
    }
    const parsed = parseMaybeNumber(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function decodeComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch (_) {
        return value;
    }
}

export function parseAnytls(url) {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol.toLowerCase() !== 'anytls:') {
        return undefined;
    }

    const server = parsedUrl.hostname.startsWith('[') && parsedUrl.hostname.endsWith(']')
        ? parsedUrl.hostname.slice(1, -1)
        : parsedUrl.hostname;
    const port = parsedUrl.port ? parseInt(parsedUrl.port) : 443;
    const password = decodeComponent(parsedUrl.username);
    const fragment = decodeComponent(parsedUrl.hash.slice(1));
    const defaultTagServer = server.includes(':') ? `[${server}]` : server;
    const params = parsedUrl.searchParams;

    const tls = {
        enabled: true,
        insecure: parseBool(
            getFirstParam(params, ['insecure', 'skip-cert-verify', 'allowInsecure', 'allow_insecure']),
            false
        )
    };
    const serverName = getFirstParam(params, ['sni', 'servername', 'host']);
    if (serverName) {
        tls.server_name = serverName;
    }

    // These extensions are emitted by established AnyTLS clients even though
    // the core URI specification intentionally guarantees only sni/insecure.
    const alpn = parseArray(getFirstParam(params, ['alpn']));
    if (alpn) {
        tls.alpn = alpn;
    }
    const fingerprint = getFirstParam(params, ['fp', 'fingerprint', 'client-fingerprint']);
    if (fingerprint) {
        tls.utls = {
            enabled: true,
            fingerprint
        };
    }

    const udp = parseBool(getFirstParam(params, ['udp']));
    const idleSessionCheckInterval = parseOptionalNumber(
        getFirstParam(params, ['idle-session-check-interval', 'idle_session_check_interval'])
    );
    const idleSessionTimeout = parseOptionalNumber(
        getFirstParam(params, ['idle-session-timeout', 'idle_session_timeout'])
    );
    const minIdleSession = parseOptionalNumber(
        getFirstParam(params, ['min-idle-session', 'min_idle_session'])
    );

    return {
        tag: fragment || `AnyTLS ${defaultTagServer}:${port}`,
        type: 'anytls',
        server,
        server_port: port,
        password,
        ...(udp !== undefined ? { udp } : {}),
        ...(idleSessionCheckInterval !== undefined ? { 'idle-session-check-interval': idleSessionCheckInterval } : {}),
        ...(idleSessionTimeout !== undefined ? { 'idle-session-timeout': idleSessionTimeout } : {}),
        ...(minIdleSession !== undefined ? { 'min-idle-session': minIdleSession } : {}),
        tls
    };
}
