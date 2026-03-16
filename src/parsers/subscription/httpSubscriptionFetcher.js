import { decodeBase64 } from '../../utils.js';
import { parseSubscriptionContent } from './subscriptionContentParser.js';

/**
 * Decode content, trying Base64 first, then URL decoding if needed
 * @param {string} text - Raw text content
 * @returns {string} - Decoded content
 */
function decodeContent(text) {
    let decodedText;
    try {
        decodedText = decodeBase64(text.trim());
        if (decodedText.includes('%')) {
            decodedText = decodeURIComponent(decodedText);
        }
    } catch (e) {
        decodedText = text;
        if (decodedText.includes('%')) {
            try {
                decodedText = decodeURIComponent(decodedText);
            } catch (urlError) {
                console.warn('Failed to URL decode the text:', urlError);
            }
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
 * @param {object} options - Optional options
 * @param {object} options.cacheService - Optional SubscriptionCacheService instance
 * @param {boolean} options.cacheEnabled - Whether to use cache (default: true)
 * @returns {Promise<object|string[]|null>} - Parsed subscription content
 */
export async function fetchSubscription(url, userAgent, options = {}) {
    const { cacheService, cacheEnabled = true } = options;

    try {
        let text;
        let fromCache = false;
        let warning = null;

        if (cacheService && cacheEnabled) {
            const result = await cacheService.fetchWithCache(url, {
                headers: { 'User-Agent': userAgent },
                cacheEnabled
            });

            if (!result.success) {
                throw new Error(`Download failed: ${result.error || 'No content available'}`);
            }

            if (result.warning) {
                warning = result.warning;
                console.warn(result.warning);
            }

            text = result.content;
            fromCache = result.fromCache;
        } else {
            // Direct fetch without cache
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
            text = await response.text();
        }

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
 * @param {object} options - Optional options
 * @param {object} options.cacheService - Optional SubscriptionCacheService instance
 * @param {boolean} options.cacheEnabled - Whether to use cache (default: true)
 * @returns {Promise<{content: string, format: 'clash'|'singbox'|'unknown', url: string, fromCache?: boolean, warning?: string}|null>}
 */
export async function fetchSubscriptionWithFormat(url, userAgent, options = {}) {
    const { cacheService, cacheEnabled = true } = options;

    try {
        let text;
        let fromCache = false;
        let warning = null;

        if (cacheService && cacheEnabled) {
            const result = await cacheService.fetchWithCache(url, {
                headers: { 'User-Agent': userAgent },
                cacheEnabled
            });

            if (!result.success) {
                throw new Error(`Download failed: ${result.error || 'No content available'}`);
            }

            if (result.warning) {
                warning = result.warning;
                console.warn(result.warning);
            }

            text = result.content;
            fromCache = result.fromCache;
        } else {
            // Direct fetch without cache
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
            text = await response.text();
        }

        const content = decodeContent(text);
        const format = detectFormat(content);

        return { content, format, url, fromCache, warning };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }
}
