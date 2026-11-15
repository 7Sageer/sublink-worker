/**
 * Parse a Quantumult X server line into the internal (Sing-Box style) proxy object.
 * Reference: https://github.com/crossutility/Quantumult-X/blob/master/sample.conf
 *
 *   shadowsocks=host:port, method=..., password=..., obfs=..., tag=...
 *   vmess=host:port, method=..., password=<uuid>, obfs=ws|wss|over-tls|http, ...
 *   vless=host:port, method=none, password=<uuid>, obfs=..., vless-flow=..., reality-...
 *   trojan=host:port, password=..., over-tls=true | obfs=wss, ...
 *   anytls=host:port, password=..., over-tls=true, ...
 */

// host:port right after `type=` distinguishes QX lines from Surge's `Name = type, host, port`
export const QUANX_PROXY_LINE = /^(shadowsocks|vmess|vless|trojan|anytls|http|socks5)\s*=\s*(\[[^\]]+\]|[^\s,:\[\]]+):(\d+)\s*(,|$)/i;

function parseParams(parts) {
    const params = {};
    parts.forEach(part => {
        const index = part.indexOf('=');
        if (index > 0) params[part.slice(0, index).trim().toLowerCase()] = part.slice(index + 1).trim();
    });
    return params;
}

function parseBoolParam(value) {
    if (value === undefined) return undefined;
    return String(value).toLowerCase() === 'true';
}

function buildTls(params, serverName) {
    const tls = {
        enabled: true,
        server_name: serverName,
        insecure: params['tls-verification'] !== undefined && !parseBoolParam(params['tls-verification'])
    };
    if (params['reality-base64-pubkey']) {
        tls.reality = {
            enabled: true,
            public_key: params['reality-base64-pubkey'],
            short_id: params['reality-hex-shortid']
        };
        // Same default the vless URI parser applies: reality requires a uTLS fingerprint in sing-box
        tls.utls = { enabled: true, fingerprint: 'chrome' };
    }
    return tls;
}

// vmess/vless/trojan encode transport and TLS together in `obfs`
function buildV2rayTransport(params) {
    const obfs = (params.obfs || '').toLowerCase();
    const host = params['obfs-host'];
    const path = params['obfs-uri'] || '/';
    if (obfs === 'ws' || obfs === 'wss') {
        return { type: 'ws', path, ...(host ? { headers: { host } } : {}) };
    }
    if (obfs === 'http' || obfs.endsWith('-http')) {
        return { type: 'http', method: 'GET', path: [path], ...(host ? { headers: { host: [host] } } : {}) };
    }
    return undefined;
}

function v2rayTls(params) {
    const obfs = (params.obfs || '').toLowerCase();
    if (obfs !== 'wss' && obfs !== 'over-tls') return undefined;
    // Sub-Store style puts SNI in tls-host; the official sample uses obfs-host for over-tls
    return buildTls(params, params['tls-host'] || params['obfs-host']);
}

const CONVERTERS = {
    shadowsocks(base, params) {
        if (params['ssr-protocol']) return null; // SSR has no internal representation
        const proxy = { ...base, type: 'shadowsocks', method: params.method, password: params.password };
        const obfs = (params.obfs || '').toLowerCase();
        if (obfs === 'http' || obfs === 'tls') {
            proxy.plugin = 'obfs';
            proxy.plugin_opts = { mode: obfs, ...(params['obfs-host'] ? { host: params['obfs-host'] } : {}), ...(params['obfs-uri'] ? { path: params['obfs-uri'] } : {}) };
        } else if (obfs === 'ws' || obfs === 'wss') {
            proxy.plugin = 'v2ray-plugin';
            proxy.plugin_opts = { mode: 'websocket', path: params['obfs-uri'] || '/', ...(params['obfs-host'] ? { host: params['obfs-host'] } : {}), ...(obfs === 'wss' ? { tls: true } : {}) };
        } else if (obfs) {
            return null; // e.g. ss over-tls: no equivalent outside QX
        }
        return proxy;
    },
    vmess(base, params) {
        const method = (params.method || '').toLowerCase();
        return {
            ...base,
            type: 'vmess',
            uuid: params.password,
            alter_id: params.aead !== undefined && !parseBoolParam(params.aead) ? 1 : 0,
            security: ['none', 'aes-128-gcm', 'chacha20-poly1305'].includes(method) ? method : 'auto',
            transport: buildV2rayTransport(params),
            tls: v2rayTls(params)
        };
    },
    vless(base, params) {
        return {
            ...base,
            type: 'vless',
            uuid: params.password,
            transport: buildV2rayTransport(params),
            tls: v2rayTls(params) || { enabled: false },
            flow: params['vless-flow'] || undefined
        };
    },
    trojan(base, params) {
        const ws = (params.obfs || '').toLowerCase() === 'wss';
        return {
            ...base,
            type: 'trojan',
            password: params.password,
            transport: ws ? buildV2rayTransport(params) : undefined,
            tls: buildTls(params, params['tls-host'] || params['obfs-host'])
        };
    },
    anytls(base, params) {
        return { ...base, type: 'anytls', password: params.password, tls: buildTls(params, params['tls-host']) };
    }
};

export function convertQuanxProxyToObject(line) {
    const match = typeof line === 'string' ? line.trim().match(QUANX_PROXY_LINE) : null;
    if (!match) return null;
    const kind = match[1].toLowerCase();
    const converter = CONVERTERS[kind];
    if (!converter) return null; // http/socks5 proxies are not part of the internal model

    const server = match[2].replace(/^\[|\]$/g, '');
    const port = parseInt(match[3], 10);
    const params = parseParams(line.trim().slice(line.trim().indexOf(',') + 1).split(','));
    const udp = parseBoolParam(params['udp-relay']);
    const base = {
        tag: params.tag || `${kind} ${server}:${port}`,
        server,
        server_port: port,
        tcp_fast_open: parseBoolParam(params['fast-open']) ?? false,
        ...(udp !== undefined ? { udp } : {})
    };
    return converter(base, params);
}
