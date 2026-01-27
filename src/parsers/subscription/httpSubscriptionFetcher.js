import { decodeBase64 } from '../../utils.js';
import { parseSubscriptionContent } from './subscriptionContentParser.js';

/**
 * Decode content, trying Base64 first, then URL decoding if needed
 * @param {string} text - Raw text content
 * @returns {string} - Decoded content
 */
function decodeContent(text) {
    const raw = text ?? '';
    const trimmed = typeof raw === 'string' ? raw.trim() : `${raw}`.trim();

    // Only attempt Base64 decoding when content is plausibly Base64.
    // Our `decodeBase64()` helper is permissive and does not reliably throw on invalid input,
    // so we must gate it to avoid corrupting plain-text YAML/JSON subscriptions.
    const isBase64Like =
        /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed) &&
        trimmed.replace(/[\r\n]/g, '').length % 4 === 0;

    let decodedText = trimmed;
    if (isBase64Like) {
        decodedText = decodeBase64(trimmed);
    }

    if (decodedText.includes('%')) {
        try {
            decodedText = decodeURIComponent(decodedText);
        } catch (urlError) {
            console.warn('Failed to URL decode the text:', urlError);
        }
    }

    return decodedText;
}

/**
 * Detect the format of subscription content
 * @param {string} content - Decoded subscription content
 * @returns {'clash'|'singbox'|'unknown'} - Detected format
 */
function detectFormat(content) {
    const trimmed = content.trim();

    // Try JSON (Sing-Box format)
    if (trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.outbounds || parsed.inbounds || parsed.route) {
                return 'singbox';
            }
        } catch {
            // Not valid JSON
        }
    }

    // Try YAML (Clash format) - check for proxies: key
    if (trimmed.includes('proxies:')) {
        return 'clash';
    }

    return 'unknown';
}

/**
 * Fetch subscription content from a URL and parse it
 * @param {string} url - The subscription URL to fetch
 * @param {string} userAgent - Optional User-Agent header
 * @returns {Promise<object|string[]|null>} - Parsed subscription content
 */
export async function fetchSubscription(url, userAgent) {
    try {
        const headers = new Headers();
        if (userAgent) {
            headers.set('User-Agent', userAgent);
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const decodedText = decodeContent(text);

        return parseSubscriptionContent(decodedText);
    } catch (error) {
        console.error('Error fetching or parsing HTTP(S) content:', error);
        return null;
    }
}

/**
 * Fetch subscription content and detect its format without parsing
 * @param {string} url - The subscription URL to fetch
 * @param {string} userAgent - Optional User-Agent header
 * @returns {Promise<{content: string, format: 'clash'|'singbox'|'unknown', url: string}|null>}
 */
export async function fetchSubscriptionWithFormat(url, userAgent) {
    try {
        const headers = new Headers();
        if (userAgent) {
            headers.set('User-Agent', userAgent);
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const content = decodeContent(text);
        const format = detectFormat(content);

        return { content, format, url };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
}
