export const AUTH_COOKIE_NAME = 'sublink_auth';

const AUTH_COOKIE_VERSION = 'v1';
const SIGNATURE_ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

export async function createAuthCookieValue(secret, now, ttlSeconds) {
    const expiresAt = Math.floor(now / 1000) + ttlSeconds;
    const payload = `${AUTH_COOKIE_VERSION}.${expiresAt}`;
    const signature = await signPayload(payload, secret);
    return `${payload}.${signature}`;
}

export async function isValidAuthCookie(value, secret, now) {
    if (!value || !secret) {
        return false;
    }

    const parts = value.split('.');
    if (parts.length !== 3 || parts[0] !== AUTH_COOKIE_VERSION) {
        return false;
    }

    const expiresAt = Number(parts[1]);
    if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(now / 1000)) {
        return false;
    }

    const payload = `${parts[0]}.${parts[1]}`;
    const expectedSignature = await signPayload(payload, secret);
    return timingSafeEqual(parts[2], expectedSignature);
}

export function timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    let diff = a.length ^ b.length;
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i += 1) {
        diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return diff === 0;
}

async function signPayload(payload, secret) {
    const subtle = getSubtleCrypto();
    const encoder = new TextEncoder();
    const key = await subtle.importKey(
        'raw',
        encoder.encode(secret),
        SIGNATURE_ALGORITHM,
        false,
        ['sign']
    );
    const signature = await subtle.sign(SIGNATURE_ALGORITHM.name, key, encoder.encode(payload));
    return bytesToBase64Url(new Uint8Array(signature));
}

function getSubtleCrypto() {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
        throw new Error('Web Crypto API is unavailable');
    }
    return subtle;
}

function bytesToBase64Url(bytes) {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
