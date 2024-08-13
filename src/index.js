import { ConfigBuilder } from './SingboxConfigBuilder.js';
import { generateHtml } from './htmlBuilder.js';
import { ClashConfigBuilder } from './ClashConfigBuilder.js';
import { encodeBase64, GenerateWebPath} from './utils.js';
import { PREDEFINED_RULE_SETS } from './config.js';

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
      let selectedRules = url.searchParams.get('selectedRules');
    
      if (!inputString) {
        return new Response('Missing config parameter', { status: 400 });
      }
    
      // deal with predefined rule sets
      if (PREDEFINED_RULE_SETS[selectedRules]) {
        selectedRules = PREDEFINED_RULE_SETS[selectedRules];
      } else {
        try {
          selectedRules = JSON.parse(decodeURIComponent(selectedRules));
        } catch (error) {
          console.error('Error parsing selectedRules:', error);
          selectedRules = PREDEFINED_RULE_SETS.minimal;  // 使用默认最小规则集
        }
      }
    
      let configBuilder;
      if (url.pathname.startsWith('/singbox')) {
        configBuilder = new ConfigBuilder(inputString, selectedRules);
      } else {
        configBuilder = new ClashConfigBuilder(inputString, selectedRules);
      }
    
      const config = await configBuilder.build();
    
      return new Response(
        url.pathname.startsWith('/singbox') ? JSON.stringify(config, null, 2) : config,
        {
          headers: { 
            'content-type': url.pathname.startsWith('/singbox') 
              ? 'application/json; charset=utf-8' 
              : 'text/yaml; charset=utf-8' 
          }
        }
      );
    }  if (url.pathname === '/shorten') {
      const originalUrl = url.searchParams.get('url');
      if (!originalUrl) {
        return new Response('Missing URL parameter', { status: 400 });
      }
  
      const shortCode = GenerateWebPath();
      await R2_BUCKET.put(`urls/${shortCode}`, originalUrl);
  
      const shortUrl = `${url.origin}/s/${shortCode}`;
      return new Response(JSON.stringify({ shortUrl }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    if (url.pathname.startsWith('/s/')) {
      const shortCode = url.pathname.split('/')[2];
      const originalUrl = await R2_BUCKET.get(`urls/${shortCode}`);
  
      if (originalUrl === null) {
        return new Response('Short URL not found', { status: 404 });
      }
  
      return Response.redirect(await originalUrl.text(), 302);
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