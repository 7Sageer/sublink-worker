import Redis from 'ioredis';
import { createFileAssetFetcher } from '../adapters/assets/fileAssetFetcher.js';
import { UpstashKVAdapter } from '../adapters/kv/upstashKv.js';
import { MemoryKVAdapter } from '../adapters/kv/memoryKv.js';
import { RedisKVAdapter } from '../adapters/kv/redisKv.js';

export function createVercelRuntime(env = process.env) {
    return {
        kv: resolveKv(env),
        assetFetcher: createFileAssetFetcher('public'),
        logger: console,
        config: {
            configTtlSeconds: undefined,
            shortLinkTtlSeconds: null
        }
    };
}

function resolveKv(env) {
    const redisAdapter = createRedisAdapter(env);
    if (redisAdapter) {
        return redisAdapter;
    }
    if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
        return new UpstashKVAdapter({
            url: env.KV_REST_API_URL,
            token: env.KV_REST_API_TOKEN
        });
    }
    return new MemoryKVAdapter();
}

function createRedisAdapter(env) {
    const connection = buildRedisConnection(env);
    if (!connection) {
        return null;
    }
    const client = connection.url
        ? new Redis(connection.url, connection.options)
        : new Redis(connection.options);
    return new RedisKVAdapter({
        client,
        prefix: connection.prefix,
        manageConnection: true
    });
}

function buildRedisConnection(env) {
    const prefix = env.REDIS_KEY_PREFIX || undefined;
    const commonOptions = buildCommonRedisOptions(env);
    if (env.REDIS_URL) {
        return {
            url: env.REDIS_URL,
            prefix,
            options: commonOptions
        };
    }
    if (env.REDIS_HOST && env.REDIS_PORT) {
        return {
            prefix,
            options: {
                ...commonOptions,
                host: env.REDIS_HOST,
                port: Number(env.REDIS_PORT)
            }
        };
    }
    return null;
}

function buildCommonRedisOptions(env) {
    const options = {};
    if (env.REDIS_USERNAME) {
        options.username = env.REDIS_USERNAME;
    }
    if (env.REDIS_PASSWORD) {
        options.password = env.REDIS_PASSWORD;
    }
    if (env.REDIS_TLS === 'true') {
        options.tls = {};
    }
    return options;
}
