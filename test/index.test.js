import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('Worker', () => {
    it('responds with HTML on root path', async () => {
        const request = new Request('http://example.com/');
        const response = await SELF.fetch(request);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/html');
        const text = await response.text();
        expect(text).toContain('<!DOCTYPE html>');
    });

    it('responds with 404 for unknown paths', async () => {
        const request = new Request('http://example.com/unknown-path');
        const response = await SELF.fetch(request);
        expect(response.status).toBe(404);
    });
});
