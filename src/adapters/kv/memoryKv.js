// setTimeout delays above 2^31-1 ms overflow and fire immediately,
// so long TTLs (e.g. the 30-day config default) must re-arm instead.
const MAX_TIMEOUT_MS = 0x7fffffff;

export class MemoryKVAdapter {
    constructor() {
        this.store = new Map();
        this.expirations = new Map();
    }

    async get(key) {
        if (this.isExpired(key)) {
            this.store.delete(key);
            this.expirations.delete(key);
            return null;
        }
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
        const expireAt = Date.now() + ttlSeconds * 1000;
        const arm = () => {
            const remaining = expireAt - Date.now();
            if (remaining <= 0) {
                this.store.delete(key);
                this.expirations.delete(key);
                return;
            }
            this.expirations.set(key, { timeoutId: setTimeout(arm, Math.min(remaining, MAX_TIMEOUT_MS)), expireAt });
        };
        arm();
    }

    clearExpiration(key) {
        const entry = this.expirations.get(key);
        if (entry) {
            clearTimeout(entry.timeoutId);
            this.expirations.delete(key);
        }
    }

    isExpired(key) {
        const entry = this.expirations.get(key);
        return entry ? Date.now() >= entry.expireAt : false;
    }
}
