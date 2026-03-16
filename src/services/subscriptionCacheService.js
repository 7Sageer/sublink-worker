/**
 * Subscription Cache Service
 *
 * Purpose: Store subscription content persistently in D1 for offline access
 * Problem solved: Subscription links with time-limited tokens (10min/1-time use)
 *
 * Strategy:
 * - On fetch: try remote first, if success -> update cache
 * - On fetch failure: use cached content as fallback
 * - Cache never expires (until manually cleared)
 */

// User-Agent pool for retry mechanism
const USER_AGENTS = [
    {
        ua: 'FlClash/v0.8.74 clash-verge Platform/windows',
        headers: {
            'accept-encoding': 'gzip, br',
            'connection': 'Keep-Alive',
            'user-agent': 'FlClash/v0.8.74 clash-verge Platform/windows',
            'x-forwarded-proto': 'https',
            'x-real-ip': '47.91.20.160'
        }
    },
    { ua: 'curl/7.88.1', headers: { 'user-agent': 'curl/7.88.1' } },
    { ua: 'ClashforWindows/0.20.31', headers: { 'user-agent': 'ClashforWindows/0.20.31' } },
    { ua: 'clash-verge/v1.7.4', headers: { 'user-agent': 'clash-verge/v1.7.4' } },
    { ua: 'Surge/5.2.0', headers: { 'user-agent': 'Surge/5.2.0' } },
    { ua: 'Quantumult%20X/1.2.3', headers: { 'user-agent': 'Quantumult%20X/1.2.3' } },
    { ua: 'ShadowsocksX-NG/1.8.2', headers: { 'user-agent': 'ShadowsocksX-NG/1.8.2' } },
    {
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.5'
        }
    },
    {
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15',
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    }
];

// D1 schema for subscription cache
const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS subscription_cache (
        cache_key TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        success_count INTEGER DEFAULT 1,
        fail_count INTEGER DEFAULT 0
    )
`;

/**
 * Generate cache key for URL using DJB2 hash (32-bit)
 * @param {string} url - URL to generate key for
 * @returns {string} - Cache key (8-char hex)
 */
export function generateCacheKey(url) {
    if (!url || typeof url !== 'string') {
        return 'invalid-url';
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(url);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data[i];
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

/**
 * Fetch with retry mechanism
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Max retry attempts
 * @returns {Promise<string>} - Response text
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const uaIndex = (attempt - 1) % USER_AGENTS.length;
            const uaConfig = USER_AGENTS[uaIndex];

            const headers = new Headers(options.headers || {});

            if (!headers.has('user-agent')) {
                headers.set('user-agent', uaConfig.ua);
            }

            // Add real client headers only on first attempt
            if (attempt === 1) {
                for (const [key, value] of Object.entries(uaConfig.headers)) {
                    if (key !== 'user-agent') {
                        headers.set(key, value);
                    }
                }
                try {
                    const urlObj = new URL(url);
                    headers.set('referer', `${urlObj.protocol}//${urlObj.host}/`);
                } catch (e) {}
                if (!headers.has('accept')) {
                    headers.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
                }
            }

            const response = await fetch(url, {
                method: 'GET',
                headers,
                ...options
            });

            if (response.ok) {
                return await response.text();
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            lastError = error;
            console.log(`Download attempt ${attempt} failed: ${url}, Error: ${error.message}`);
        }
    }

    throw lastError;
}

/**
 * Subscription Cache Service Class
 */
export class SubscriptionCacheService {
    constructor(db) {
        this.db = db;
        this.dbInitialized = false;
    }

    /**
     * Initialize the database schema
     * @returns {Promise<boolean>}
     */
    async init() {
        if (this.dbInitialized || !this.db) {
            return this.dbInitialized;
        }

        try {
            if (typeof this.db.exec !== 'function') {
                console.warn('D1 db.exec is not a function, skipping init');
                return false;
            }
            await this.db.exec(CREATE_TABLE_SQL).catch(e => {
                if (!e.message?.includes('duration')) throw e;
            });
            this.dbInitialized = true;
            console.log('D1 subscription_cache table initialized');
            return true;
        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                this.dbInitialized = true;
                console.log('D1 table already exists');
                return true;
            }
            console.warn('Failed to initialize D1 database (non-fatal):', error.message);
            return false;
        }
    }

    /**
     * Get cached content from D1
     * @param {string} cacheKey - Cache key
     * @returns {Promise<object|null>}
     */
    async getCachedContent(cacheKey) {
        if (!this.db) {
            return null;
        }

        try {
            const result = await this.db.prepare(`
                SELECT content, success_count, fail_count, created_at
                FROM subscription_cache
                WHERE cache_key = ?
            `).bind(cacheKey).first();

            if (result) {
                return {
                    content: result.content,
                    successCount: result.success_count,
                    failCount: result.fail_count,
                    createdAt: result.created_at
                };
            }
        } catch (error) {
            console.warn(`D1 read error for ${cacheKey}:`, error.message);
        }
        return null;
    }

    /**
     * Save content to D1 cache (only on success)
     * @param {string} cacheKey - Cache key
     * @param {string} url - Original URL
     * @param {string} content - Content to cache
     * @returns {Promise<boolean>}
     */
    async saveToCache(cacheKey, url, content) {
        if (!this.db) {
            return false;
        }

        try {
            const now = Date.now();

            await this.db.prepare(`
                INSERT OR REPLACE INTO subscription_cache
                (cache_key, url, content, created_at, updated_at, success_count, fail_count)
                VALUES (?, ?, ?, COALESCE(
                    (SELECT created_at FROM subscription_cache WHERE cache_key = ?),
                    ?
                ), ?, COALESCE(
                    (SELECT success_count + 1 FROM subscription_cache WHERE cache_key = ?),
                    1
                ), COALESCE(
                    (SELECT fail_count FROM subscription_cache WHERE cache_key = ?),
                    0
                ))
            `).bind(cacheKey, url, content, cacheKey, now, now, cacheKey, cacheKey).run();

            console.log(`Cached ${cacheKey}, url: ${(url || '').substring(0, 50)}...`);
            return true;
        } catch (error) {
            console.error(`Error saving cache to D1 for ${cacheKey}:`, error.message);
            return false;
        }
    }

    /**
     * Record a failed fetch attempt
     * @param {string} cacheKey - Cache key
     * @returns {Promise<boolean>}
     */
    async recordFailAttempt(cacheKey) {
        if (!this.db) {
            return false;
        }

        try {
            await this.db.prepare(`
                UPDATE subscription_cache
                SET fail_count = fail_count + 1, updated_at = ?
                WHERE cache_key = ?
            `).bind(Date.now(), cacheKey).run();
            return true;
        } catch (error) {
            console.error(`Error recording fail for ${cacheKey}:`, error.message);
            return false;
        }
    }

    /**
     * Clear cache for a specific URL
     * @param {string} cacheKey - Cache key
     * @returns {Promise<boolean>}
     */
    async clearCache(cacheKey) {
        if (!this.db) {
            return false;
        }

        try {
            await this.db.prepare(`
                DELETE FROM subscription_cache WHERE cache_key = ?
            `).bind(cacheKey).run();
            return true;
        } catch (error) {
            console.error(`Error clearing cache for ${cacheKey}:`, error.message);
            return false;
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<object>}
     */
    async getCacheStats() {
        if (!this.db) {
            return { error: 'D1 database not initialized' };
        }

        try {
            const total = await this.db.prepare(`
                SELECT COUNT(*) as count FROM subscription_cache
            `).first();

            const withSuccess = await this.db.prepare(`
                SELECT COUNT(*) as count FROM subscription_cache WHERE success_count > 0
            `).first();

            return {
                totalCached: total?.count || 0,
                withSuccess: withSuccess?.count || 0
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Clear all cache
     * @returns {Promise<boolean>}
     */
    async clearAllCache() {
        if (!this.db) {
            return false;
        }

        try {
            await this.db.prepare(`DELETE FROM subscription_cache`).run();
            console.log('All cache cleared');
            return true;
        } catch (error) {
            console.error('Error clearing all cache:', error.message);
            return false;
        }
    }

    /**
     * Fetch with cache fallback (core logic)
     * Strategy:
     * 1. Try to fetch from remote
     * 2. If success: update cache, return fresh content
     * 3. If failure: return cached content (if exists)
     * @param {string} url - URL to fetch
     * @param {object} options - Options including cacheEnabled
     * @returns {Promise<object>}
     */
    async fetchWithCache(url, options = {}) {
        const cacheEnabled = options.cacheEnabled !== false;
        const maxRetries = options.maxRetries || 3;

        // If cache disabled or no DB, do direct fetch
        if (!cacheEnabled || !this.db) {
            try {
                const content = await fetchWithRetry(url, options, maxRetries);
                return { content, fromCache: false, success: true };
            } catch (error) {
                return { content: null, fromCache: false, success: false, error: error?.message };
            }
        }

        const cacheKey = generateCacheKey(url);

        // Try to fetch fresh content
        try {
            console.log(`Fetching: ${url}`);
            const content = await fetchWithRetry(url, options, maxRetries);

            // Success: update cache
            await this.saveToCache(cacheKey, url, content);

            return {
                content,
                fromCache: false,
                success: true
            };
        } catch (error) {
            console.error(`Fetch failed for ${url}:`, error.message);

            // Record failure for stats
            await this.recordFailAttempt(cacheKey);

            // Failure: try to use cached content as fallback
            const cached = await this.getCachedContent(cacheKey);

            if (cached && cached.content) {
                console.log(`Using cached content for ${cacheKey}`);
                return {
                    content: cached.content,
                    fromCache: true,
                    success: true,
                    warning: 'Remote fetch failed, using cached content'
                };
            }

            // No cache available
            return {
                content: null,
                fromCache: false,
                success: false,
                error: error?.message || 'Unknown error'
            };
        }
    }
}

/**
 * Create SubscriptionCacheService instance
 * @param {object} db - D1 database binding
 * @returns {SubscriptionCacheService}
 */
export function createSubscriptionCacheService(db) {
    return new SubscriptionCacheService(db);
}
