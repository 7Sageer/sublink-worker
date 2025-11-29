/**
 * Storage abstraction layer for Cloudflare KV
 */

export class StorageAdapter {
    constructor(env) {
        this.kv = env.SUBLINK_KV;
    }

    async get(key) {
        return await this.kv.get(key);
    }

    async put(key, value, options = {}) {
        return await this.kv.put(key, value, options);
    }

    async delete(key) {
        return await this.kv.delete(key);
    }
}

/**
 * Get storage instance from context
 */
export function getStorage(c) {
    return new StorageAdapter(c.env);
}
