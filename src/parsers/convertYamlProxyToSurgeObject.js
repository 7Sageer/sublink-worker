import { convertYamlProxyToObject } from './convertYamlProxyToObject.js';

export function convertYamlProxyToSurgeObject(source) {
    if (!source || typeof source !== 'object' || !source.type) return null;

    // Trojan always uses TLS, even when a Clash subscription omits the flag.
    const input = String(source.type).toLowerCase() === 'trojan' ? { ...source, tls: source.tls ?? true } : source;
    const proxy = convertYamlProxyToObject(input) ?? {
        tag: source.name || source.tag || 'proxy',
        type: String(source.type).toLowerCase(),
        server: source.server,
        server_port: source.port
    };

    // Keep target-specific fields out of the shared sing-box representation.
    return { ...proxy, surgeSource: source };
}
