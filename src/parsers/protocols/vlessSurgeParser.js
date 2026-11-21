import { convertYamlProxyToSurgeObject } from '../convertYamlProxyToSurgeObject.js';
import { InvalidConfigError } from '../../services/errors.js';

export function parseVlessForSurge(uri) {
    let url;
    let name;
    let uuid;
    try {
        url = new URL(uri.trim());
        name = decodeURIComponent(url.hash.slice(1)) || 'VLESS';
        uuid = decodeURIComponent(url.username);
    } catch (_) {
        throw new InvalidConfigError('Invalid VLESS share link');
    }
    const params = Object.fromEntries(url.searchParams);
    const network = params.type || 'tcp';
    const security = params.security || 'none';
    const source = Object.fromEntries(Object.entries({
        name,
        type: 'vless',
        server: url.hostname.replace(/^\[|\]$/g, ''),
        port: Number(url.port || 443),
        uuid,
        network,
        tls: security === 'tls' || security === 'reality',
        servername: params.sni,
        flow: params.flow,
        encryption: params.encryption,
        alpn: params.alpn?.split(','),
        'skip-cert-verify': params.allowInsecure ?? params.insecure ?? params.allow_insecure,
        fingerprint: params.pcs,
        'name-cert-verify': params.vcn,
        'client-fingerprint': params.fp,
        udp: params.udp,
        ...(security === 'reality' ? { 'reality-opts': { 'public-key': params.pbk, 'short-id': params.sid } } : {}),
        ...(['ws', 'httpupgrade'].includes(network) ? {
            'ws-opts': { path: params.path, ...(params.host ? { headers: { Host: params.host } } : {}) }
        } : {}),
        ...(network === 'grpc' ? { 'grpc-opts': { 'grpc-service-name': params.serviceName } } : {}),
        ...(['xhttp', 'splithttp'].includes(network) ? {
            'xhttp-opts': { path: params.path, host: params.host, mode: params.mode }
        } : {})
    }).filter(([, value]) => value !== undefined));
    // Share-link-only options must not enter the shared sing-box representation.
    return { ...convertYamlProxyToSurgeObject(source), surgeVlessUri: params };
}
