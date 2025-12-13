import http from 'http';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export function startNodeHttpServer(app, { port = 8787, logger = console } = {}) {
    const server = http.createServer(async (req, res) => {
        try {
            const request = toRequest(req);
            const response = await app.fetch(request);
            await sendResponse(res, response);
        } catch (error) {
            logger.error?.('Node server error', error);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    server.listen(port, () => {
        logger.info?.(`Sublink worker running on http://0.0.0.0:${port}`);
    });

    return server;
}

function toRequest(req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost';
    const url = `${protocol}://${host}${req.url}`;
    const method = req.method || 'GET';
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
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
            const nextValues = Array.isArray(value) ? value : [value];
            res.setHeader('Set-Cookie', [...cookies, ...nextValues]);
        } else {
            res.setHeader(key, value);
        }
    });

    if (!response.body) {
        res.end();
        return;
    }

    const readable = Readable.fromWeb(response.body);
    try {
        await pipeline(readable, res);
    } catch (error) {
        res.destroy(error);
        throw error;
    }
}
