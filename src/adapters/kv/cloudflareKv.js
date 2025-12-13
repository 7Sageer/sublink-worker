export class CloudflareKVAdapter {
    constructor(binding) {
        this.binding = binding;
    }

    async get(key) {
        return this.binding.get(key);
    }

    async put(key, value, options = {}) {
        return this.binding.put(key, value, options);
    }

    async delete(key) {
        return this.binding.delete(key);
    }
}
