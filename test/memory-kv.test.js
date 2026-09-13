import { describe, expect, it, vi, afterEach } from 'vitest';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

describe('MemoryKVAdapter', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps values with TTLs beyond the setTimeout limit', async () => {
        vi.useFakeTimers();
        const kv = new MemoryKVAdapter();
        await kv.put('k', 'v', { expirationTtl: 60 * 60 * 24 * 30 });

        // 2^31-1 ms overflow used to fire the expiration immediately
        await vi.advanceTimersByTimeAsync(60 * 1000);
        expect(await kv.get('k')).toBe('v');
    });

    it('expires values after their TTL', async () => {
        vi.useFakeTimers();
        const kv = new MemoryKVAdapter();
        await kv.put('k', 'v', { expirationTtl: 60 });

        await vi.advanceTimersByTimeAsync(61 * 1000);
        expect(await kv.get('k')).toBeNull();
    });

    it('keeps values without TTL indefinitely', async () => {
        vi.useFakeTimers();
        const kv = new MemoryKVAdapter();
        await kv.put('k', 'v');

        await vi.advanceTimersByTimeAsync(60 * 60 * 24 * 31 * 1000);
        expect(await kv.get('k')).toBe('v');
    });
});
