/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { Hono } from 'hono';
import { Layout } from './components/Layout.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Form } from './components/Form.jsx';
import { SingboxConfigBuilder } from './SingboxConfigBuilder.js';
import { ClashConfigBuilder } from './ClashConfigBuilder.js';
import { SurgeConfigBuilder } from './SurgeConfigBuilder.js';
import { createTranslator } from './i18n/index.js';
import { encodeBase64, GenerateWebPath, tryDecodeSubscriptionLines } from './utils.js';
import yaml from 'js-yaml';

const app = new Hono();

// Middleware to handle language
app.use('*', async (c, next) => {
    const lang = c.req.query('lang') || c.req.header('Accept-Language')?.split(',')[0] || 'zh-CN';
    c.set('lang', lang);
    c.set('t', createTranslator(lang));
    await next();
});

// Main Page
app.get('/', (c) => {
    const t = c.get('t');

    return c.html(
        <Layout title={t('pageTitle')} description={t('pageDescription')} keywords={t('pageKeywords')}>
            <Navbar />
            <div class="container mx-auto px-4 py-8 pt-24">
                <div class="max-w-4xl mx-auto">
                    <div class="text-center mb-12 pt-8">
                        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                            {t('pageTitle')}
                        </h1>
                        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            {t('pageDescription')}
                        </p>
                    </div>
                    <Form t={t} />
                </div>
            </div>
        </Layout>
    );
});

// Config Generation Routes
app.get('/singbox', async (c) => {
    try {
        const config = c.req.query('config');
        const selectedRules = JSON.parse(c.req.query('selectedRules') || '[]');
        const customRules = JSON.parse(c.req.query('customRules') || '[]');
        const ua = c.req.query('ua');
        const groupByCountry = c.req.query('group_by_country') === 'true';
        const enableClashUI = c.req.query('enable_clash_ui') === 'true';
        const externalController = c.req.query('external_controller');
        const externalUiDownloadUrl = c.req.query('external_ui_download_url');
        const configId = c.req.query('configId');
        const lang = c.get('lang');

        if (!config) {
            return c.text('Missing config parameter', 400);
        }

        let baseConfig;
        if (configId) {
            const customConfig = await c.env.SUBLINK_KV.get(configId);
            if (customConfig) {
                baseConfig = JSON.parse(customConfig);
            }
        }

        const builder = new SingboxConfigBuilder(config, selectedRules, customRules, baseConfig, lang, ua, groupByCountry, enableClashUI, externalController, externalUiDownloadUrl);
        await builder.build();
        return c.json(builder.config);
    } catch (e) {
        return c.text(`Error: ${e.message}`, 500);
    }
});

app.get('/clash', async (c) => {
    try {
        const config = c.req.query('config');
        const selectedRules = JSON.parse(c.req.query('selectedRules') || '[]');
        const customRules = JSON.parse(c.req.query('customRules') || '[]');
        const ua = c.req.query('ua');
        const groupByCountry = c.req.query('group_by_country') === 'true';
        const enableClashUI = c.req.query('enable_clash_ui') === 'true';
        const externalController = c.req.query('external_controller');
        const externalUiDownloadUrl = c.req.query('external_ui_download_url');
        const configId = c.req.query('configId');
        const lang = c.get('lang');

        if (!config) {
            return c.text('Missing config parameter', 400);
        }

        let baseConfig;
        if (configId) {
            const customConfig = await c.env.SUBLINK_KV.get(configId);
            if (customConfig) {
                baseConfig = JSON.parse(customConfig);
            }
        }

        const builder = new ClashConfigBuilder(
            config,
            selectedRules,
            customRules,
            baseConfig,
            lang,
            ua,
            groupByCountry,
            enableClashUI,
            externalController,
            externalUiDownloadUrl
        );
        await builder.build();
        return c.text(builder.formatConfig(), 200, {
            'Content-Type': 'text/yaml; charset=utf-8'
        });
    } catch (e) {
        return c.text(`Error: ${e.message}`, 500);
    }
});

app.get('/surge', async (c) => {
    try {
        const config = c.req.query('config');
        const selectedRules = JSON.parse(c.req.query('selectedRules') || '[]');
        const customRules = JSON.parse(c.req.query('customRules') || '[]');
        const ua = c.req.query('ua');
        const groupByCountry = c.req.query('group_by_country') === 'true';
        const lang = c.get('lang');

        if (!config) {
            return c.text('Missing config parameter', 400);
        }

        const builder = new SurgeConfigBuilder(config, selectedRules, customRules, undefined, lang, ua, groupByCountry);
        builder.setSubscriptionUrl(c.req.url);
        await builder.build();

        c.header('subscription-userinfo', 'upload=0; download=0; total=10737418240; expire=2546249531');
        return c.text(builder.formatConfig());
    } catch (e) {
        return c.text(`Error: ${e.message}`, 500);
    }
});

app.get('/xray', async (c) => {
    const inputString = c.req.query('config');
    if (!inputString) {
        return c.text('Missing config parameter', 400);
    }

    const proxylist = inputString.split('\n');
    const finalProxyList = [];
    let userAgent = c.req.query('ua') || 'curl/7.74.0';

    const headers = { 'User-Agent': userAgent };

    for (const proxy of proxylist) {
        const trimmedProxy = proxy.trim();
        if (!trimmedProxy) continue;

        if (trimmedProxy.startsWith('http://') || trimmedProxy.startsWith('https://')) {
            try {
                const response = await fetch(trimmedProxy, { method: 'GET', headers });
                const text = await response.text();
                let processed = tryDecodeSubscriptionLines(text, { decodeUriComponent: true });
                if (!Array.isArray(processed)) processed = [processed];
                finalProxyList.push(...processed.filter(item => typeof item === 'string' && item.trim() !== ''));
            } catch (e) {
                console.warn('Failed to fetch the proxy:', e);
            }
        } else {
            let processed = tryDecodeSubscriptionLines(trimmedProxy);
            if (!Array.isArray(processed)) processed = [processed];
            finalProxyList.push(...processed.filter(item => typeof item === 'string' && item.trim() !== ''));
        }
    }

    const finalString = finalProxyList.join('\n');
    if (!finalString) {
        return c.text('Missing config parameter', 400);
    }

    return c.text(encodeBase64(finalString));
});

// Shorten URL Route
app.get('/shorten-v2', async (c) => {
    const url = c.req.query('url');
    let shortCode = c.req.query('shortCode');

    if (!url) {
        return c.text('Missing URL parameter', 400);
    }

    const parsedUrl = new URL(url);
    const queryString = parsedUrl.search;

    if (!shortCode) {
        shortCode = GenerateWebPath();
    }

    await c.env.SUBLINK_KV.put(shortCode, queryString);
    return c.text(shortCode);
});

// Shortened URL Redirect Routes
app.get('/s/:code', async (c) => {
    const code = c.req.param('code');
    const originalParam = await c.env.SUBLINK_KV.get(code);
    if (!originalParam) return c.text('Short URL not found', 404);

    const url = new URL(c.req.url);
    return c.redirect(`${url.origin}/surge${originalParam}`);
});

app.get('/b/:code', async (c) => {
    const code = c.req.param('code');
    const originalParam = await c.env.SUBLINK_KV.get(code);
    if (!originalParam) return c.text('Short URL not found', 404);

    const url = new URL(c.req.url);
    return c.redirect(`${url.origin}/singbox${originalParam}`);
});

app.get('/c/:code', async (c) => {
    const code = c.req.param('code');
    const originalParam = await c.env.SUBLINK_KV.get(code);
    if (!originalParam) return c.text('Short URL not found', 404);

    const url = new URL(c.req.url);
    return c.redirect(`${url.origin}/clash${originalParam}`);
});

app.get('/x/:code', async (c) => {
    const code = c.req.param('code');
    const originalParam = await c.env.SUBLINK_KV.get(code);
    if (!originalParam) return c.text('Short URL not found', 404);

    const url = new URL(c.req.url);
    return c.redirect(`${url.origin}/xray${originalParam}`);
});

// Config Storage Endpoint
app.post('/config', async (c) => {
    try {
        const { type, content } = await c.req.json();
        const configId = `${type}_${GenerateWebPath(8)}`;

        let configString;
        if (type === 'clash') {
            if (typeof content === 'string' && (content.trim().startsWith('-') || content.includes(':'))) {
                const yamlConfig = yaml.load(content);
                configString = JSON.stringify(yamlConfig);
            } else {
                configString = typeof content === 'object' ? JSON.stringify(content) : content;
            }
        } else {
            configString = typeof content === 'object' ? JSON.stringify(content) : content;
        }

        JSON.parse(configString); // Validate JSON

        await c.env.SUBLINK_KV.put(configId, configString, {
            expirationTtl: 60 * 60 * 24 * 30 // 30 days
        });

        return c.text(configId);
    } catch (error) {
        return c.text(`Invalid format: ${error.message}`, 400);
    }
});

// Resolve Short URL Endpoint
app.get('/resolve', async (c) => {
    const shortUrl = c.req.query('url');
    const t = c.get('t');

    if (!shortUrl) return c.text(t('missingUrl'), 400);

    try {
        const urlObj = new URL(shortUrl);
        const pathParts = urlObj.pathname.split('/');

        if (pathParts.length < 3) return c.text(t('invalidShortUrl'), 400);

        const prefix = pathParts[1];
        const shortCode = pathParts[2];

        if (!['b', 'c', 'x', 's'].includes(prefix)) return c.text(t('invalidShortUrl'), 400);

        const originalParam = await c.env.SUBLINK_KV.get(shortCode);
        if (!originalParam) return c.text(t('shortUrlNotFound'), 404);

        const mapping = { b: 'singbox', c: 'clash', x: 'xray', s: 'surge' };
        const originalUrl = `${urlObj.origin}/${mapping[prefix]}${originalParam}`;

        return c.json({ originalUrl });
    } catch (error) {
        return c.text(t('invalidShortUrl'), 400);
    }
});

app.get('/favicon.ico', (c) => {
    return c.redirect('https://cravatar.cn/avatar/9240d78bbea4cf05fb04f2b86f22b18d?s=160&d=retro&r=g');
});

export default app;
