import { ConfigBuilder } from './SingboxConfigBuilder.js';
import { generateHtml } from './htmlBuilder.js';
import { ClashConfigBuilder } from './ClashConfigBuilder.js';
import { encodeBase64, GenerateWebPath} from './utils.js';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      // Return the HTML form for GET requests
      return new Response(generateHtml('', '', ''), {
        headers: { 'Content-Type': 'text/html' }
      });
    }  else if (request.method === 'POST' && url.pathname === '/') {
      const formData = await request.formData();
      const inputString = formData.get('input');
      const selectedRules = formData.getAll('selectedRules');
    
      if (!inputString) {
        return new Response('Missing input parameter', { status: 400 });
      }
    
      // If no rules are selected, use the default rules
      const rulesToUse = selectedRules.length > 0 ? selectedRules : ['广告拦截', '谷歌服务', '国外媒体', '电报消息'];
    
      const xrayUrl = `${url.origin}/xray?config=${encodeURIComponent(inputString)}`;
      const singboxUrl = `${url.origin}/singbox?config=${encodeURIComponent(inputString)}&selectedRules=${encodeURIComponent(JSON.stringify(rulesToUse))}`;
      const clashUrl = `${url.origin}/clash?config=${encodeURIComponent(inputString)}&selectedRules=${encodeURIComponent(JSON.stringify(rulesToUse))}`;
    
      return new Response(generateHtml(xrayUrl, singboxUrl, clashUrl), {
        headers: { 'Content-Type': 'text/html' }
      });
    } else if (url.pathname.startsWith('/singbox') || url.pathname.startsWith('/clash')) {
      const inputString = url.searchParams.get('config');
      const selectedRules = JSON.parse(decodeURIComponent(url.searchParams.get('selectedRules')));

      if (!inputString) {
        return new Response('Missing config parameter', { status: 400 });
      }

      let configBuilder;
      if (url.pathname.startsWith('/singbox')) {
        configBuilder = new ConfigBuilder(inputString, selectedRules);
        const config = await configBuilder.build();

        return new Response(JSON.stringify(config, null, 2), {
          headers: { 'content-type': 'application/json; charset=utf-8' }
        });
      } else {
        configBuilder = new ClashConfigBuilder(inputString, selectedRules);
        const config = await configBuilder.build();

        return new Response(config, {
          headers: { 'content-type': 'text/yaml; charset=utf-8' }
        });
      }


    } else if (request.method === 'POST' && url.pathname === '/shorten-all') {
      // Handle shortening all URLs
      const { xray, singbox, clash } = await request.json();
      
      if (!xray || !singbox || !clash) {
        return new Response('Missing URL parameters', { status: 400 });
      }

      const shortCode = GenerateWebPath();
      
      // Store only the content once
      await R2_BUCKET.put(`urls/${shortCode}`, JSON.stringify({ xray, singbox, clash }));

      const xrayShortUrl = `${url.origin}/x/${shortCode}`;
      const singboxShortUrl = `${url.origin}/s/${shortCode}`;
      const clashShortUrl = `${url.origin}/c/${shortCode}`;
      
      return new Response(JSON.stringify({ xrayShortUrl, singboxShortUrl, clashShortUrl }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (url.pathname.startsWith('/x/') || url.pathname.startsWith('/s/') || url.pathname.startsWith('/c/')) {
      // Handle shortened URLs
      const [, type, shortCode] = url.pathname.split('/');
      const key = `urls/${shortCode}`;
      const object = await R2_BUCKET.get(key);

      if (object === null) {
        return new Response('Short URL not found', { status: 404 });
      }

      const data = JSON.parse(await object.text());
      const longUrl = data[type === 'x' ? 'xray' : type === 's' ? 'singbox' : 'clash'];
      
      if (!longUrl) {
        return new Response('Invalid URL type', { status: 400 });
      }

      return Response.redirect(longUrl, 302);
    } else if (url.pathname.startsWith('/xray')) {
      // Handle Xray config requests
      const inputString = url.searchParams.get('config');

      if (!inputString) {
        return new Response('Missing config parameter', { status: 400 });
      }

      return new Response(encodeBase64(inputString), {
        headers: { 'content-type': 'application/json; charset=utf-8' }
      });
    } else if (url.pathname === '/favicon.ico') {
    return Response.redirect('https://cravatar.cn/avatar/9240d78bbea4cf05fb04f2b86f22b18d?s=160&d=retro&r=g', 301)
  }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}