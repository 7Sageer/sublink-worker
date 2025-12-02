import { describe, it, expect, beforeEach } from 'vitest';
import { RedisKVAdapter } from '../src/adapters/kv/redisKv.js';

class FakeRedisClient {
    constructor() {
        this.store = new Map();
        this.ttls = new Map();
    }

    async get(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }

    async set(key, value, mode, ttlSeconds) {
        this.store.set(key, value);
        if (mode === 'EX' && typeof ttlSeconds === 'number') {
            this.ttls.set(key, ttlSeconds);
        } else {
            this.ttls.delete(key);
        }
    }

    async del(key) {
        this.store.delete(key);
        this.ttls.delete(key);
    }

    async quit() {
        this.store.clear();
        this.ttls.clear();
    }
}

describe('RedisKVAdapter', () => {
    let client;
    let adapter;

    beforeEach(() => {
        client = new FakeRedisClient();
        adapter = new RedisKVAdapter({ client, prefix: 'tests' });
    });

    it('stores and retrieves values', async () => {
        await adapter.put('greeting', 'hello');
        await adapter.put('farewell', 'bye');

        await expect(adapter.get('greeting')).resolves.toBe('hello');
        await expect(adapter.get('farewell')).resolves.toBe('bye');
    });

    it('deletes values', async () => {
        await adapter.put('temp', 'value');
        await adapter.delete('temp');

        await expect(adapter.get('temp')).resolves.toBeNull();
    });

    it('applies ttl when provided', async () => {
        await adapter.put('ttl-key', 'value', { expirationTtl: 30 });
        expect(client.ttls.get('tests:ttl-key')).toBe(30);
    });
});
