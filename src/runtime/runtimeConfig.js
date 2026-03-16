/**
 * @typedef {Object} KeyValueStore
 * @property {(key: string) => Promise<string | null>} get
 * @property {(key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>} put
 * @property {(key: string) => Promise<void>} delete
 */

/**
 * @typedef {(request: Request) => Promise<Response>} AssetFetcher
 */

/**
 * @typedef {Object} SubscriptionCacheService
 * @property {(key: string) => Promise<object|null>} getCachedContent
 * @property {(key: string, url: string, content: string) => Promise<boolean>} saveToCache
 * @property {(key: string) => Promise<boolean>} recordFailAttempt
 * @property {(key: string) => Promise<boolean>} clearCache
 * @property {() => Promise<object>} getCacheStats
 * @property {() => Promise<boolean>} clearAllCache
 * @property {(url: string, options?: object) => Promise<object>} fetchWithCache
 */

/**
 * @typedef {Object} RuntimeConfig
 * @property {number} [configTtlSeconds]
 * @property {number} [shortLinkTtlSeconds]
 */

/**
 * @typedef {Object} RuntimeBindings
 * @property {KeyValueStore | null} [kv]
 * @property {AssetFetcher | null} [assetFetcher]
 * @property {SubscriptionCacheService | null} [subscriptionCache]
 * @property {Console} [logger]
 * @property {RuntimeConfig} [config]
 */

const DEFAULTS = {
    configTtlSeconds: 60 * 60 * 24 * 30
};

/**
 * Normalize optional runtime bindings and provide safe defaults.
 *
 * @param {RuntimeBindings | undefined} runtime
 * @returns {{ kv: KeyValueStore | null, assetFetcher: AssetFetcher | null, subscriptionCache: SubscriptionCacheService | null, logger: Console, config: RuntimeConfig & { configTtlSeconds: number, shortLinkTtlSeconds: number | null } }}
 */
export function normalizeRuntime(runtime = {}) {
    return {
        kv: runtime.kv ?? null,
        assetFetcher: runtime.assetFetcher ?? null,
        subscriptionCache: runtime.subscriptionCache ?? null,
        logger: runtime.logger ?? console,
        config: {
            configTtlSeconds: runtime.config?.configTtlSeconds ?? DEFAULTS.configTtlSeconds,
            shortLinkTtlSeconds: runtime.config?.shortLinkTtlSeconds ?? null
        }
    };
}
