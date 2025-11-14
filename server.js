import express from 'express';
import bodyParser from 'body-parser';
import { SingboxConfigBuilder } from './src/SingboxConfigBuilder.js';
import { generateHtml } from './src/htmlBuilder.js';
import { ClashConfigBuilder } from './src/ClashConfigBuilder.js';
import { SurgeConfigBuilder } from './src/SurgeConfigBuilder.js';
import { GenerateWebPath } from './src/utils.js';
import { PREDEFINED_RULE_SETS } from './src/config.js';
import { t, setLanguage } from './src/i18n/index.js';
import yaml from 'js-yaml';
import { kvGet, kvPut } from './src/kvSqlite.js';

const app = express();
const PORT = process.env.PORT || 7788;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/src/img', express.static('src/img'))

app.get('/', (req, res) => {
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0];
  setLanguage(lang);
  res.setHeader('Content-Type', 'text/html');
  res.send(generateHtml('', '', '', '', req.protocol + '://' + req.get('host')));
});

app.get(['/singbox', '/clash', '/surge'], async (req, res) => {
  let { config: inputString, selectedRules, customRules, lang, ua: userAgent, configId } = req.query;
  lang = lang || 'zh-CN';
  setLanguage(lang);
  userAgent = userAgent || 'curl/7.74.0';

  if (!inputString) return res.status(400).send(t('missingConfig'));

  let normalizedInput = inputString.replace(/\\n/g, '\n').replace(/,/g, '\n');

  if (PREDEFINED_RULE_SETS[selectedRules]) {
    selectedRules = PREDEFINED_RULE_SETS[selectedRules];
  } else {
    try {
      selectedRules = JSON.parse(decodeURIComponent(selectedRules));
    } catch {
      selectedRules = PREDEFINED_RULE_SETS.minimal;
    }
  }

  try {
    customRules = JSON.parse(decodeURIComponent(customRules));
  } catch {
    customRules = [];
  }

  let baseConfig;
  if (configId) {
    const customConfig = kvGet(configId);
    if (customConfig) baseConfig = JSON.parse(customConfig);
  }

  let configBuilder;
  if (req.path.startsWith('/singbox')) {
    configBuilder = new SingboxConfigBuilder(normalizedInput, selectedRules, customRules, baseConfig, lang, userAgent);
  } else if (req.path.startsWith('/clash')) {
    configBuilder = new ClashConfigBuilder(normalizedInput, selectedRules, customRules, baseConfig, lang, userAgent);
  } else {
    configBuilder = new SurgeConfigBuilder(normalizedInput, selectedRules, customRules, baseConfig, lang, userAgent)
      .setSubscriptionUrl(req.protocol + '://' + req.get('host') + req.originalUrl);
  }

  const config = await configBuilder.build();

  if (req.path.startsWith('/singbox')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(config, null, 2));
  } else if (req.path.startsWith('/clash')) {
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.send(config);
  } else {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('subscription-userinfo', 'upload=0; download=0; total=10737418240; expire=2546249531');
    res.send(config);
  }
});

app.get('/xray', async (req, res) => {
  let inputString = req.query.config;
  if (!inputString) return res.status(400).send('Missing config parameter');
  inputString = inputString.replace(/\\n/g, '\n').replace(/,/g, '\n');
  const proxylist = inputString.split('\n');
  const finalProxyList = [];
  let userAgent = req.query.ua || 'curl/7.74.0';

  for (const proxy of proxylist) {
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
      try {
        const response = await fetch(proxy, { headers: { 'User-Agent': userAgent } });
        let text = await response.text();
        let decodedText = Buffer.from(text.trim(), 'base64').toString();
        if (decodedText.includes('%')) {
          decodedText = decodeURIComponent(decodedText);
        }
        finalProxyList.push(...decodedText.split('\n'));
      } catch (e) {
        // 忽略错误
      }
    } else {
      finalProxyList.push(proxy);
    }
  }
  const finalString = finalProxyList.join('\n');
  if (!finalString) return res.status(400).send('Missing config parameter');
  const encoded = Buffer.from(finalString).toString('base64');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(encoded);
});

app.get('/shorten', (req, res) => {
  const originalUrl = req.query.url;
  if (!originalUrl) return res.status(400).send(t('missingUrl'));
  const shortCode = GenerateWebPath();
  kvPut(shortCode, originalUrl);
  const shortUrl = `${req.protocol}://${req.get('host')}/s/${shortCode}`;
  res.json({ shortUrl });
});

app.get('/shorten-v2', (req, res) => {
  const originalUrl = req.query.url;
  let shortCode = req.query.shortCode;
  if (!originalUrl) return res.status(400).send('Missing URL parameter');
  const parsedUrl = new URL(originalUrl);
  const queryString = parsedUrl.search;
  if (!shortCode) shortCode = GenerateWebPath();
  kvPut(shortCode, queryString);
  res.type('text/plain').send(shortCode);
});

app.get(['/b/:code', '/c/:code', '/x/:code', '/s/:code'], (req, res) => {
  const { code } = req.params;
  const originalParam = kvGet(code);
  let originalUrl = null;
  if (req.path.startsWith('/b/')) originalUrl = `${req.protocol}://${req.get('host')}/singbox${originalParam}`;
  else if (req.path.startsWith('/c/')) originalUrl = `${req.protocol}://${req.get('host')}/clash${originalParam}`;
  else if (req.path.startsWith('/x/')) originalUrl = `${req.protocol}://${req.get('host')}/xray${originalParam}`;
  else if (req.path.startsWith('/s/')) originalUrl = `${req.protocol}://${req.get('host')}/surge${originalParam}`;
  if (!originalUrl) return res.status(404).send(t('shortUrlNotFound'));
  res.redirect(302, originalUrl);
});

app.post('/config', async (req, res) => {
  const { type, content } = req.body;
  const configId = `${type}_${GenerateWebPath(8)}`;
  try {
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
    JSON.parse(configString);
    kvPut(configId, configString, { expirationTtl: 60 * 60 * 24 * 30 });
    res.type('text/plain').send(configId);
  } catch (error) {
    res.status(400).type('text/plain').send(t('invalidFormat') + error.message);
  }
});

app.get('/resolve', (req, res) => {
  const shortUrl = req.query.url;
  if (!shortUrl) return res.status(400).send(t('missingUrl'));
  try {
    const urlObj = new URL(shortUrl);
    const pathParts = urlObj.pathname.split('/');
    if (pathParts.length < 3) return res.status(400).send(t('invalidShortUrl'));
    const prefix = pathParts[1];
    const shortCode = pathParts[2];
    if (!['b', 'c', 'x', 's'].includes(prefix)) return res.status(400).send(t('invalidShortUrl'));
    const originalParam = kvGet(shortCode);
    if (!originalParam) return res.status(404).send(t('shortUrlNotFound'));
    let originalUrl;
    if (prefix === 'b') originalUrl = `${req.protocol}://${req.get('host')}/singbox${originalParam}`;
    else if (prefix === 'c') originalUrl = `${req.protocol}://${req.get('host')}/clash${originalParam}`;
    else if (prefix === 'x') originalUrl = `${req.protocol}://${req.get('host')}/xray${originalParam}`;
    else if (prefix === 's') originalUrl = `${req.protocol}://${req.get('host')}/surge${originalParam}`;
    res.json({ originalUrl });
  } catch {
    res.status(400).send(t('invalidShortUrl'));
  }
});

app.get('/api-doc', (req, res) => {
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0] || 'zh-CN';
  setLanguage(lang);
  const doc = t('apiDoc');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${doc.title} - sub-converter</title>
      <link rel="icon" href="/src/img/favicon.ico" type="image/x-icon">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { background: #f8f9fa; color: #222; margin: 0; }
        .api-doc-header {
          background: linear-gradient(90deg, #1f579b 0%, #1f560f 100%);
          color: #fff;
          padding: 2rem 0 1.2rem 0;
          text-align: center;
          margin-bottom: 2rem;
          box-shadow: 0 2px 12px rgba(106,17,203,0.08);
        }
        .api-doc-header h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: 2px; margin-left: 7rem;}
        .container { max-width: 900px; margin: 0 auto 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); padding: 2.5rem 2rem; }
        h2 { margin-top: 2.5rem; border-left: 4px solid #6a11cb; padding-left: 0.5rem; font-size: 1.5rem; }
        h3 { margin-top: 1.5rem; font-size: 1.15rem; color: #2575fc; }
        pre { background: #f3f3f3; border-radius: 8px; padding: 1rem; font-size: 1rem; overflow-x: auto; }
        code { color: #c7254e; background: #f9f2f4; border-radius: 4px; padding: 2px 4px; }
        .back-link {background-color: #ffffff;color: #0a78ff; font-weight: 500;float: right; margin-top: 30px; margin-right: 40px; }
        .api-nav {padding-top: 1rem; margin-bottom: 2rem; }
        .api-nav a { margin-right: 1.2rem; color: #a6b9d8; text-decoration: none; font-weight: 500;}
        .api-nav a:hover { text-decoration: underline; }
        @media (max-width: 600px) {
          .container { padding: 1rem 0.5rem; }
          .api-doc-header h1 { font-size: 1.5rem; }
          .back-link { margin-right: 10px; }
        }
        hr { margin: 2.5rem 0 2rem 0; border: none; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <a href="/" class="btn btn-outline-secondary back-link">${doc.back}</a>
      <div class="api-doc-header">
        <h1>${doc.title}</h1>
        <div class="api-nav">
          <a href="#main">${doc.nav.main}</a>
          <a href="#params">${doc.nav.params}</a>
          <a href="#examples">${doc.nav.examples}</a>
          <a href="#response">${doc.nav.response}</a>
          <a href="#more">${doc.nav.more}</a>
        </div>
      </div>
      <div class="container">
        <p>${doc.intro}</p>
        <hr>
        <h2 id="main">${doc.nav.main}</h2>
        <ul>
          ${doc.mainList.map(item => `<li><b>${item.path}</b> - ${item.desc}</li>`).join('')}
        </ul>
        <hr>
        <h2 id="params">${doc.nav.params}</h2>
        <ul>
          ${doc.params.map(item => `<li><b>${item.key}</b>：${item.desc}</li>`).join('')}
        </ul>
        <hr>
        <h2 id="examples">${doc.nav.examples}</h2>
        ${doc.examples.map((ex, i) => `
          <h3>${i+1}. ${ex.title}</h3>
          <pre>${ex.extra ? ex.extra + '\n' : ''}${doc.labels.example} ${ex.example}\n${doc.labels.desc} ${ex.desc}</pre>
        `).join('')}
        <hr>
        <h2 id="response">${doc.nav.response}</h2>
        <ul>
          ${doc.response.map(r => `<li>${r}</li>`).join('')}
        </ul>
        <hr>
        <h2 id="more">${doc.nav.more}</h2>
        <ul>
          ${doc.more.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>
    </body>
    </html>
  `);
});

app.use((req, res) => {
  res.status(404).send(t('notFound'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
