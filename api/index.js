import { createRequire } from 'module';
import { Readable } from 'stream';
import { createVercelRuntime } from '../src/runtime/vercel.js';
import 'hono/jsx/jsx-runtime';

const runtime = createVercelRuntime(process.env);
const appPromise = loadCreateApp().then((createApp) => createApp(runtime));

async function loadCreateApp() {
    try {
        const mod = await import('../dist/vercel/createApp.js');
        if (!mod?.createApp) {
            throw new Error('Compiled Vercel bundle is missing createApp export');
        }
        return mod.createApp;
    } catch (error) {
        if (error?.code !== 'ERR_MODULE_NOT_FOUND') {
            throw error;
        }
    }

    const { register } = await import('esbuild-register/dist/node');
    register({
        extensions: ['.ts', '.tsx', '.jsx'],
        jsx: 'automatic',
        target: 'es2020'
    });

    const require = createRequire(import.meta.url);
    const { createApp } = require('../src/app/createApp.jsx');
    return createApp;
}

export const config = {
    runtime: 'nodejs'
};

export default async function handler(req, res) {
    try {
        const app = await appPromise;
        const request = toRequest(req);
        const response = await app.fetch(request);
        await sendResponse(res, response);
    } catch (error) {
        console.error('Vercel handler error', error);
        if (!res.headersSent) {
            res.statusCode = 500;
        }
        res.end('Internal Server Error');
    }
}

function toRequest(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = `${protocol}://${host}${req.url ?? ''}`;
    const method = req.method || 'GET';
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
            for (const entry of value) {
                headers.append(key, entry);
            }
        } else {
            headers.set(key, value);
        }
    }

    if (method === 'GET' || method === 'HEAD') {
        return new Request(url, { method, headers });
    }

    const body = Readable.toWeb(req);
    return new Request(url, {
        method,
        headers,
        body,
        duplex: 'half'
    });
}

async function sendResponse(res, response) {
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
            const existing = res.getHeader('Set-Cookie');
            const cookies = Array.isArray(existing) ? existing : existing ? [existing] : [];
            cookies.push(value);
            res.setHeader('Set-Cookie', cookies);
        } else {
            res.setHeader(key, value);
        }
    });

    if (!response.body) {
        res.end();
        return;
    }

    const readable = Readable.fromWeb(response.body);
    await new Promise((resolve, reject) => {
        readable.on('error', reject);
        res.on('error', reject);
        res.on('close', resolve);
        readable.on('end', resolve);
        readable.pipe(res);
    });
}
