import { describe, expect, it, vi } from 'vitest';

vi.mock('ioredis', () => ({ default: class Redis {} }));

describe('createNodeRuntime', () => {
    it('preserves zero as the no-expiration config TTL', async () => {
        const { createNodeRuntime } = await import('../src/runtime/node.js');
        const runtime = createNodeRuntime({
            CONFIG_TTL_SECONDS: '0',
            DISABLE_MEMORY_KV: 'true'
        });

        expect(runtime.config.configTtlSeconds).toBe(0);
    });
});
