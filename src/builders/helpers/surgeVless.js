import { parseBool } from '../../utils.js';
import { InvalidConfigError } from '../../services/errors.js';

// Mihomo YAML, Xray share-link extra, Surge suffix. Units stay unchanged.
const XHTTP_FIELDS = [
    ['path', 'path', 'path'],
    ['host', 'host', 'host'],
    ['mode', 'mode', 'mode'],
    ['no-grpc-header', 'noGRPCHeader', 'no-grpc-header'],
    ['x-padding-bytes', 'xPaddingBytes', 'padding-bytes'],
    ['x-padding-obfs-mode', 'xPaddingObfsMode', 'padding-obfs'],
    ['x-padding-key', 'xPaddingKey', 'padding-key'],
    ['x-padding-header', 'xPaddingHeader', 'padding-header'],
    ['x-padding-placement', 'xPaddingPlacement', 'padding-placement'],
    ['x-padding-method', 'xPaddingMethod', 'padding-method'],
    ['uplink-http-method', 'uplinkHTTPMethod', 'uplink-method'],
    ['session-placement', 'sessionIDPlacement', 'session-placement'],
    ['session-key', 'sessionIDKey', 'session-key'],
    ['session-table', 'sessionIDTable', 'session-table'],
    ['session-length', 'sessionIDLength', 'session-length'],
    ['seq-placement', 'seqPlacement', 'seq-placement'],
    ['seq-key', 'seqKey', 'seq-key'],
    ['uplink-data-placement', 'uplinkDataPlacement', 'uplink-data-placement'],
    ['uplink-data-key', 'uplinkDataKey', 'uplink-data-key'],
    ['uplink-chunk-size', 'uplinkChunkSize', 'uplink-chunk-size'],
    ['sc-max-each-post-bytes', 'scMaxEachPostBytes', 'max-each-post-bytes'],
    ['sc-min-posts-interval-ms', 'scMinPostsIntervalMs', 'min-posts-interval']
];

const XMUX_FIELDS = [
    ['max-concurrency', 'maxConcurrency', 'max-concurrency'],
    ['max-connections', 'maxConnections', 'max-connections'],
    ['c-max-reuse-times', 'cMaxReuseTimes', 'max-reuse-times'],
    ['h-max-request-times', 'hMaxRequestTimes', 'max-request-times'],
    ['h-max-reusable-secs', 'hMaxReusableSecs', 'max-reusable-secs'],
    ['h-keep-alive-period', 'hKeepAlivePeriod', 'keep-alive']
];

function boolean(value, field) {
    const result = parseBool(value);
    if (result === undefined) throw new InvalidConfigError(`Invalid VLESS ${field} flag`);
    return result;
}

function headers(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InvalidConfigError('Invalid VLESS HTTP headers');
    return Object.entries(value).map(([name, field]) => {
        if (/[\r\n:|]/.test(name) || /[\r\n|]/.test(String(field))) throw new InvalidConfigError('Invalid VLESS HTTP header');
        return `${name}:${field}`;
    }).join('|');
}

function xhttpExtra(params) {
    if (params?.extra === undefined) return {};
    try {
        const extra = JSON.parse(params.extra);
        if (extra && typeof extra === 'object' && !Array.isArray(extra)) return extra;
    } catch (_) { }
    throw new InvalidConfigError('Invalid VLESS XHTTP extra settings');
}

export function addSurgeVlessOptions(proxy, { add, map, note }) {
    const source = proxy.surgeSource;
    const uri = proxy.surgeVlessUri;
    if (uri?.security && !['none', 'tls', 'reality'].includes(uri.security)) {
        throw new InvalidConfigError('Unsupported VLESS security');
    }
    const tls = { ...proxy.tls };
    tls.server_name = source?.servername ?? source?.sni ?? tls.server_name;
    if (source?.tls !== undefined) tls.enabled = boolean(source.tls, 'tls');
    const reality = source?.['reality-opts'] !== undefined
        ? { enabled: true, public_key: source['reality-opts']?.['public-key'], short_id: source['reality-opts']?.['short-id'] }
        : tls.reality;
    if (reality?.enabled) {
        if (!reality.public_key || !/^[A-Za-z0-9+/_-]{43}=?$/.test(reality.public_key)) {
            throw new InvalidConfigError('Invalid VLESS REALITY public key');
        }
        if (reality.short_id !== undefined && !/^[0-9a-f]{0,16}$/i.test(reality.short_id)) {
            throw new InvalidConfigError('Invalid VLESS REALITY short ID');
        }
        tls.enabled = true;
        tls.reality = reality;
        add('reality-public-key', reality.public_key);
        add('reality-short-id', reality.short_id);
        map('reality-opts.public-key', 'reality-opts.short-id');
    } else {
        add('tls', tls.enabled === true);
    }
    map('tls', 'uuid', 'network', 'network-type');
    if (!proxy.uuid) throw new InvalidConfigError('VLESS requires a user ID');
    const flow = source?.flow ?? proxy.flow;
    const encryption = source?.encryption ?? proxy.encryption;
    if (flow && !['xtls-rprx-vision', 'xtls-rprx-vision-udp443'].includes(flow)) throw new InvalidConfigError('Unsupported VLESS flow');
    if (encryption !== undefined && typeof encryption !== 'string') throw new InvalidConfigError('Invalid VLESS Encryption setting');
    add('flow', flow || undefined);
    add('encryption', encryption);
    map('flow', 'encryption');

    let network = source?.network ?? source?.['network-type'] ?? proxy.transport?.type ?? proxy.network ?? 'tcp';
    if (network === 'raw') network = 'tcp';
    if (network === 'splithttp') network = 'xhttp';
    const ws = source?.['ws-opts'] ?? proxy.transport ?? {};
    const upgrade = network === 'httpupgrade' || (network === 'ws' && ws['v2ray-http-upgrade'] !== undefined && boolean(ws['v2ray-http-upgrade'], 'HTTPUpgrade'));
    if (!['tcp', 'ws', 'httpupgrade', 'grpc', 'xhttp'].includes(network)) throw new InvalidConfigError('Unsupported VLESS transport');
    if (reality?.enabled && ['ws', 'httpupgrade'].includes(network)) throw new InvalidConfigError('VLESS REALITY does not support WebSocket or HTTPUpgrade');
    if (network === 'grpc' && (!tls.enabled || flow)) throw new InvalidConfigError('VLESS gRPC requires TLS or REALITY and does not support Vision');
    if (flow && !(encryption && encryption !== 'none') && (network !== 'tcp' || !tls.enabled)) {
        throw new InvalidConfigError('VLESS Vision requires RAW with TLS/REALITY or VLESS Encryption');
    }
    const packetEncoding = source?.['packet-encoding'] ?? proxy.packet_encoding;
    if (packetEncoding && packetEncoding !== 'xudp') throw new InvalidConfigError('Surge VLESS requires XUDP packet encoding');
    map('packet-encoding');
    if (source?.udp !== undefined && boolean(source.udp, 'udp')) map('udp');

    if (['ws', 'httpupgrade'].includes(network)) {
        add('ws', true);
        if (upgrade) add('ws-http-upgrade', true);
        add('ws-path', ws.path);
        if (ws.headers) add('ws-headers', headers(ws.headers));
        map('ws-opts.path', 'ws-opts.headers', 'ws-opts.v2ray-http-upgrade');
    } else if (network === 'grpc') {
        add('grpc', true);
        add('grpc-service-name', source?.['grpc-opts']?.['grpc-service-name'] ?? proxy.transport?.service_name);
        if (uri?.mode && !['gun', 'multi'].includes(uri.mode)) throw new InvalidConfigError('Invalid VLESS gRPC mode');
        add('grpc-mode', uri?.mode);
        add('grpc-authority', uri?.authority);
        map('grpc-opts.grpc-service-name');
    } else if (network === 'xhttp') {
        const xhttp = source?.['xhttp-opts'] ?? {};
        const extra = xhttpExtra(uri);
        if (xhttp['download-settings'] != null || extra.downloadSettings != null) {
            throw new InvalidConfigError('Surge VLESS does not support XHTTP download-settings');
        }
        add('xhttp', true);
        for (const [yamlKey, uriKey, suffix] of XHTTP_FIELDS) {
            let value = xhttp[yamlKey] ?? extra[uriKey];
            if (value !== undefined && !['string', 'number', 'boolean'].includes(typeof value)) throw new InvalidConfigError(`Invalid VLESS XHTTP ${yamlKey}`);
            if (value !== undefined && ['no-grpc-header', 'padding-obfs'].includes(suffix)) value = boolean(value, suffix);
            if (suffix === 'mode' && value && !['auto', 'packet-up', 'stream-up', 'stream-one'].includes(value)) throw new InvalidConfigError('Invalid VLESS XHTTP mode');
            add(`xhttp-${suffix}`, value);
            map(`xhttp-opts.${yamlKey}`);
        }
        const extraHeaders = xhttp.headers ?? extra.headers;
        if (extraHeaders) {
            if (typeof extraHeaders !== 'object' || Array.isArray(extraHeaders)) throw new InvalidConfigError('Invalid VLESS HTTP headers');
            const host = Object.entries(extraHeaders).find(([key]) => key.toLowerCase() === 'host');
            if (host) throw new InvalidConfigError('VLESS XHTTP Host must use xhttp-opts.host');
            add('xhttp-headers', headers(extraHeaders));
            map('xhttp-opts.headers');
        }
        for (const [yamlKey, uriKey, suffix] of XMUX_FIELDS) {
            const value = xhttp['reuse-settings']?.[yamlKey] ?? extra.xmux?.[uriKey];
            if (value !== undefined && !['string', 'number'].includes(typeof value)) throw new InvalidConfigError(`Invalid VLESS XHTTP reuse ${yamlKey}`);
            add(`xhttp-xmux-${suffix}`, value);
            map(`xhttp-opts.reuse-settings.${yamlKey}`);
            if (value !== undefined && ['max-connections', 'keep-alive'].includes(suffix)) {
                note(`XHTTP xhttp-xmux-${suffix} is accepted by Surge but has no effect.`);
            }
        }
    }
    return tls;
}
