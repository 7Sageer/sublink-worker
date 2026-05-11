import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';
import { AUTH_COOKIE_NAME, createAuthCookieValue } from '../src/services/frontendAuth.js';

const AUTH_SECRET = 'deploy-secret';

const createTestApp = (config = {}) => createApp({
    kv: new MemoryKVAdapter(),
    assetFetcher: null,
    logger: console,
    config: {
        configTtlSeconds: 60,
        shortLinkTtlSeconds: null,
        ...config
    }
});

const validVmessConfig = 'vmess://ew0KICAidiI6ICIyIiwNCiAgInBzIjogInRlc3QiLA0KICAiYWRkIjogIjEuMS4xLjEiLA0KICAicG9ydCI6ICI0NDMiLA0KICAiaWQiOiAiYWRkNjY2NjYtODg4OC04ODg4LTg4ODgtODg4ODg4ODg4ODg4IiwNCiAgImFpZCI6ICIwIiwNCiAgInNjeSI6ICJhdXRvIiwNCiAgIm5ldCI6ICJ3cyIsDQogICJ0eXBlIjogIm5vbmUiLA0KICAiaG9zdCI6ICIiLA0KICAicGF0aCI6ICIvIiwNCiAgInRscyI6ICJ0bHMiDQp9';

describe('frontend auth', () => {
    it('keeps root page open when AUTH_SECRET is not configured', async () => {
        const app = createTestApp();

        const res = await app.request('http://localhost/');

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
        expect(await res.text()).toContain('Sublink Worker');
    });

    it('treats blank auth secret as disabled', async () => {
        const app = createTestApp({ authSecret: '   ' });

        const res = await app.request('http://localhost/');

        expect(res.status).toBe(200);
        expect(await res.text()).toContain('Sublink Worker');
    });

    it('redirects root page to login when auth is enabled and cookie is missing', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });

        const res = await app.request('http://localhost/');

        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe('/login?redirect=%2F');
    });

    it('renders login page without leaking the configured secret', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });

        const res = await app.request('http://localhost/login');
        const text = await res.text();

        expect(res.status).toBe(200);
        expect(text).toContain('Access secret');
        expect(text).not.toContain(AUTH_SECRET);
    });

    it('rejects invalid login secret without setting an auth cookie', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });

        const res = await app.request('http://localhost/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'secret=wrong'
        });

        expect(res.status).toBe(401);
        expect(res.headers.get('set-cookie') || '').not.toContain(AUTH_COOKIE_NAME);
        expect(await res.text()).toContain('The secret is incorrect');
    });

    it('sets a 7 day HttpOnly cookie after successful login', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });

        const res = await app.request('https://localhost/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(AUTH_SECRET)}`
        });
        const setCookie = res.headers.get('set-cookie') || '';

        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe('/');
        expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
        expect(setCookie).toContain('Max-Age=604800');
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toContain('SameSite=Lax');
        expect(setCookie).toContain('Secure');
    });

    it('allows root page with a valid auth cookie', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });
        const cookie = await createAuthCookieValue(AUTH_SECRET, Date.now(), 604800);

        const res = await app.request('http://localhost/', {
            headers: { Cookie: `${AUTH_COOKIE_NAME}=${cookie}` }
        });

        expect(res.status).toBe(200);
        expect(await res.text()).toContain('Sublink Worker');
    });

    it('rejects tampered auth cookie', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });
        const cookie = await createAuthCookieValue(AUTH_SECRET, Date.now(), 604800);

        const res = await app.request('http://localhost/', {
            headers: { Cookie: `${AUTH_COOKIE_NAME}=${cookie}x` }
        });

        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe('/login?redirect=%2F');
    });

    it('rejects expired auth cookie', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });
        const cookie = await createAuthCookieValue(AUTH_SECRET, Date.now() - 120000, 1);

        const res = await app.request('http://localhost/', {
            headers: { Cookie: `${AUTH_COOKIE_NAME}=${cookie}` }
        });

        expect(res.status).toBe(302);
        expect(res.headers.get('location')).toBe('/login?redirect=%2F');
    });

    it('does not protect subscription conversion endpoints when auth is enabled', async () => {
        const app = createTestApp({ authSecret: AUTH_SECRET });

        const singbox = await app.request(`http://localhost/singbox?config=${encodeURIComponent(validVmessConfig)}`);
        const clash = await app.request(`http://localhost/clash?config=${encodeURIComponent(validVmessConfig)}`);
        const surge = await app.request(`http://localhost/surge?config=${encodeURIComponent(validVmessConfig)}`);
        const xray = await app.request(`http://localhost/xray?config=${encodeURIComponent(validVmessConfig)}`);

        expect(singbox.status).toBe(200);
        expect(clash.status).toBe(200);
        expect(surge.status).toBe(200);
        expect(xray.status).toBe(200);
    });
});
