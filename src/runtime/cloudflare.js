import { CloudflareKVAdapter } from '../adapters/kv/cloudflareKv.js';
import { createSubscriptionCacheService } from '../services/subscriptionCacheService.js';

export function createCloudflareRuntime(env) {
    // Create subscription cache service with D1 binding
    const subscriptionDb = env?.SUBSCRIPTION_DB ? env.SUBSCRIPTION_DB : null;
    const subscriptionCache = subscriptionDb ? createSubscriptionCacheService(subscriptionDb) : null;

    // Initialize cache service if DB is available
    if (subscriptionCache) {
        subscriptionCache.init().catch(err => {
            console.warn('Failed to initialize subscription cache:', err);
        });
    }

    return {
        kv: env?.SUBLINK_KV ? new CloudflareKVAdapter(env.SUBLINK_KV) : null,
        assetFetcher: env?.ASSETS ? (request) => env.ASSETS.fetch(request) : null,
        subscriptionCache,
        logger: console,
        config: {}
    };
}
