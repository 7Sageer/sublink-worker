import { convertYamlProxyToObject } from './convertYamlProxyToObject.js';

export function convertYamlProxyToSurgeObject(source) {
    if (!source || typeof source !== 'object' || !source.type) return null;

    const proxy = convertYamlProxyToObject(source) ?? {
        tag: source.name || source.tag || 'proxy',
        type: String(source.type).toLowerCase(),
        server: source.server,
        server_port: source.port
    };

    // Keep target-specific fields out of the shared sing-box representation.
    return { ...proxy, surgeSource: source };
}
