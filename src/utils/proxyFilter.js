import { decodeBase64 } from '../utils.js';

export const SUPPORTED_PROXY_PROTOCOLS = [
    'shadowsocks',
    'vmess',
    'vless',
    'hysteria2',
    'trojan',
    'tuic'
];

const SUPPORTED_PROTOCOL_SET = new Set(SUPPORTED_PROXY_PROTOCOLS);

export function normalizeExcludedProtocols(value) {
    let protocols = value;
    if (typeof protocols === 'string') {
        try {
            protocols = JSON.parse(protocols);
        } catch {
            protocols = protocols.split(',');
        }
    }

    if (!Array.isArray(protocols)) return [];

    return [...new Set(
        protocols
            .map(protocol => String(protocol).trim().toLowerCase())
            .filter(protocol => SUPPORTED_PROTOCOL_SET.has(protocol))
    )];
}

export function normalizeExcludedSSMethods(value) {
    const methods = Array.isArray(value) ? value : String(value || '').split(',');
    return [...new Set(
        methods
            .map(method => String(method).trim().toLowerCase())
            .filter(Boolean)
    )];
}

export function shouldExcludeProxy(proxy, excludedProtocols = [], excludedSSMethods = []) {
    if (!proxy || typeof proxy !== 'object') return false;

    const protocols = normalizeExcludedProtocols(excludedProtocols);
    const methods = normalizeExcludedSSMethods(excludedSSMethods);
    const type = String(proxy.type || '').toLowerCase();

    if (protocols.includes(type)) return true;

    return type === 'shadowsocks'
        && methods.includes(String(proxy.method || '').trim().toLowerCase());
}

export function filterProxyItems(items, excludedProtocols = [], excludedSSMethods = []) {
    return (Array.isArray(items) ? items : [])
        .filter(item => item != null)
        .filter(item => !shouldExcludeProxy(item, excludedProtocols, excludedSSMethods));
}

export function filterProxyUris(lines, excludedProtocols = [], excludedSSMethods = []) {
    const protocols = normalizeExcludedProtocols(excludedProtocols);
    const methods = normalizeExcludedSSMethods(excludedSSMethods);

    return (Array.isArray(lines) ? lines : [])
        .filter(line => typeof line === 'string' && line.trim() !== '')
        .filter(line => {
            const uri = line.trim();
            const protocol = getProtocolFromUri(uri);
            if (protocols.includes(protocol)) return false;

            return protocol !== 'shadowsocks'
                || !methods.includes(getShadowsocksMethod(uri));
        });
}

function getProtocolFromUri(uri) {
    const scheme = uri.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//)?.[1]?.toLowerCase();
    if (scheme === 'ss') return 'shadowsocks';
    if (scheme === 'hy2' || scheme === 'hysteria') return 'hysteria2';
    return scheme || '';
}

function getShadowsocksMethod(uri) {
    if (!/^ss:\/\//i.test(uri)) return '';

    try {
        const payload = uri.slice(5).split(/[?#]/, 1)[0];
        const separatorIndex = payload.lastIndexOf('@');
        const encodedCredentials = separatorIndex >= 0
            ? payload.slice(0, separatorIndex)
            : payload;

        let credentials = decodeURIComponent(encodedCredentials);
        if (!credentials.includes(':')) {
            const normalized = credentials.replace(/-/g, '+').replace(/_/g, '/');
            credentials = decodeBase64(normalized);
        }

        if (separatorIndex < 0 && credentials.includes('@')) {
            credentials = credentials.slice(0, credentials.lastIndexOf('@'));
        }

        return credentials.split(':', 1)[0].trim().toLowerCase();
    } catch {
        return '';
    }
}
