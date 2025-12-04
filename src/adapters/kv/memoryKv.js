export class MemoryKVAdapter {
    constructor() {
        this.store = new Map();
        this.expirations = new Map();
    }

    async get(key) {
        this.cleanExpired(key);
        return this.store.has(key) ? this.store.get(key) : null;
    }

    async put(key, value, options = {}) {
        this.store.set(key, value);
        if (options.expirationTtl) {
            this.scheduleExpiration(key, options.expirationTtl);
        } else {
            this.clearExpiration(key);
        }
    }

    async delete(key) {
        this.store.delete(key);
        this.clearExpiration(key);
    }

    scheduleExpiration(key, ttlSeconds) {
        this.clearExpiration(key);
        const timeoutId = setTimeout(() => {
            this.store.delete(key);
            this.expirations.delete(key);
        }, ttlSeconds * 1000);
        this.expirations.set(key, timeoutId);
    }

    clearExpiration(key) {
        const timeoutId = this.expirations.get(key);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.expirations.delete(key);
        }
    }

    cleanExpired(key) {
        if (!this.expirations.has(key)) return;
        if (!this.store.has(key)) {
            this.clearExpiration(key);
        }
    }
}
