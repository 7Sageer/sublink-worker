import { InvalidPayloadError } from '../services/errors.js';

export const IR_VERSION = '1.0.0';

export function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function sanitizeTags(tags) {
    if (!tags) return [];
    return []
        .concat(tags)
        .map(tag => (tag == null ? '' : String(tag).trim()))
        .filter(Boolean);
}

export function normalizeKind(kind) {
    if (!kind) return '';
    const k = String(kind).trim().toLowerCase();
    if (k === 'ss') return 'shadowsocks';
    if (k === 'hy2') return 'hysteria2';
    return k;
}

export function requireField(condition, message) {
    if (!condition) throw new InvalidPayloadError(message);
}

