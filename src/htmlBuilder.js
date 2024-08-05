import { UNIFIED_RULES } from './config.js';

const generateHead = () => `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sublink Worker</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
      ${generateStyles()}
    </style>
  </head>
`;

const generateStyles = () => `
  :root {
    --bg-color: #f0f2f5;
    --text-color: #495057;
    --card-bg: #ffffff;
    --card-header-bg: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    --btn-primary-bg: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    --input-bg: #ffffff;
    --input-border: #ced4da;
    --input-text: #495057;
    --checkbox-bg: #ffffff;
    --checkbox-border: #ced4da;
    --checkbox-checked-bg: #6a11cb;
    --checkbox-checked-border: #6a11cb;
    --explanation-bg: #e9ecef;
    --explanation-text: #495057;
  }

  [data-theme="dark"] {
    --bg-color: #1a1a1a;
    --text-color: #e0e0e0;
    --card-bg: #2c2c2c;
    --card-header-bg: linear-gradient(135deg, #4a0e8f 0%, #1a5ab8 100%);
    --btn-primary-bg: linear-gradient(135deg, #4a0e8f 0%, #1a5ab8 100%);
    --input-bg: #3c3c3c;
    --input-border: #555555;
    --input-text: #e0e0e0;
    --checkbox-bg: #3c3c3c;
    --checkbox-border: #555555;
    --checkbox-checked-bg: #4a0e8f;
    --checkbox-checked-border: #4a0e8f;
    --explanation-bg: #383838;
    --explanation-text: #b0b0b0;
  }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .container { max-width: 800px; }

  .card {
    background-color: var(--card-bg);
    border: none;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: background-color 0.3s ease;
  }

  .card-header {
    background: var(--card-header-bg);
    color: white;
    border-radius: 15px 15px 0 0;
    padding: 2rem;
  }

  .card-body { padding: 2rem; }

  .btn-primary {
    background: var(--btn-primary-bg);
    border: none;
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .input-group-text, .form-control {
    background-color: var(--input-bg);
    border-color: var(--input-border);
    color: var(--input-text);
  }

  .form-control:focus {
    background-color: var(--input-bg);
    color: var(--input-text);
    box-shadow: 0 0 0 0.2rem rgba(106, 17, 203, 0.25);
  }

  .input-group { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04); }

  h2, h4 {
    color: var(--text-color);
    font-weight: 600;
  }

  .form-label {
    font-weight: 500;
    color: var(--text-color);
  }

  .btn-outline-secondary {
    color: var(--text-color);
    border-color: var(--input-border);
  }

  .btn-outline-secondary:hover {
    background-color: var(--input-bg);
    color: var(--text-color);
  }

  .btn-success {
    background-color: #28a745;
    border-color: #28a745;
    color: white;
  }

  .btn-success:hover {
    background-color: #218838;
    border-color: #1e7e34;
  }

  #darkModeToggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }

  .github-link {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    font-size: 2rem;
    color: var(--text-color);
    transition: color 0.3s ease;
  }

  .github-link:hover { color: #6a11cb; }

  .form-check-input {
    background-color: var(--checkbox-bg);
    border-color: var(--checkbox-border);
  }

  .form-check-input:checked {
    background-color: var(--checkbox-checked-bg);
    border-color: var(--checkbox-checked-border);
  }

  .form-check-label {
    color: var(--text-color);
  }
  .explanation-text {
    background-color: var(--explanation-bg);
    color: var(--explanation-text);
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 15px;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
`;

const generateBody = (xrayUrl, singboxUrl, clashUrl) => `
  <body>
    ${generateDarkModeToggle()}
    ${generateGithubLink()}
    <div class="container mt-5">
      <div class="card mb-5">
        ${generateCardHeader()}
        <div class="card-body">
          ${generateForm()}
          ${generateSubscribeLinks(xrayUrl, singboxUrl, clashUrl)}
        </div>
      </div>
    </div>
    ${generateScripts()}
  </body>
`;

const generateDarkModeToggle = () => `
  <button id="darkModeToggle" class="btn btn-outline-secondary">
    <i class="fas fa-moon"></i>
  </button>
`;

const generateGithubLink = () => `
  <a href="https://github.com/7Sageer/sublink-worker" target="_blank" rel="noopener noreferrer" class="github-link">
    <i class="fab fa-github"></i>
  </a>
`;

const generateCardHeader = () => `
  <div class="card-header text-center">
    <h1 class="display-4 mb-0">Sublink Worker</h1>
  </div>
`;

const generateForm = () => `
  <form method="POST" id="encodeForm">
    <div class="mb-4">
      <label for="inputTextarea" class="form-label">Enter Your Share URLs:</label>
      <textarea class="form-control" id="inputTextarea" name="input" required placeholder="vmess://abcd..." rows="3"></textarea>
    </div>
    <div class="form-check form-switch mb-3">
      <input class="form-check-input" type="checkbox" id="advancedToggle">
      <label class="form-check-label" for="advancedToggle">Advanced Options</label>
    </div>
    <div id="advancedOptions" style="display: none;">
      ${generateRuleSetSelection()}
    </div>
    <div class="d-grid mt-4">
      <button type="submit" class="btn btn-primary btn-lg">
        <i class="fas fa-sync-alt me-2"></i>Convert
      </button>
    </div>
  </form>
`;

const generateSubscribeLinks = (xrayUrl, singboxUrl, clashUrl) => `
  <div class="mt-5">
    <h2 class="mb-4">Your subscribe links:</h2>
    ${generateLinkInput('Xray Link:', 'xrayLink', xrayUrl)}
    ${generateLinkInput('SingBox Link:', 'singboxLink', singboxUrl)}
    ${generateLinkInput('Clash Link:', 'clashLink', clashUrl)}
    <div class="d-grid">
      <button class="btn btn-primary btn-lg" type="button" onclick="shortenAllUrls()">
        <i class="fas fa-compress-alt me-2"></i>Shorten Your Subscribe links
      </button>
    </div>
  </div>
`;

const generateLinkInput = (label, id, value) => `
  <div class="mb-4">
    <label for="${id}" class="form-label">${label}</label>
    <div class="input-group">
      <span class="input-group-text"><i class="fas fa-link"></i></span>
      <input type="text" class="form-control" id="${id}" value="${value}" readonly>
      <button class="btn btn-outline-secondary" type="button" onclick="copyToClipboard('${id}')">
        <i class="fas fa-copy"></i>
      </button>
    </div>
  </div>
`;

const generateScripts = () => `
  <script>
    ${copyToClipboardFunction()}
    ${shortenAllUrlsFunction()}
    ${darkModeToggleFunction()}
    ${advancedOptionsToggleFunction()}
  </script>
`;

const advancedOptionsToggleFunction = () => `
  document.getElementById('advancedToggle').addEventListener('change', function() {
    const advancedOptions = document.getElementById('advancedOptions');
    advancedOptions.style.display = this.checked ? 'block' : 'none';
  });
`;

const copyToClipboardFunction = () => `
  function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    
    const button = element.nextElementSibling;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.remove('btn-outline-secondary');
    button.classList.add('btn-success');
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('btn-success');
      button.classList.add('btn-outline-secondary');
    }, 2000);
  }
`;

const shortenAllUrlsFunction = () => `
  async function shortenAllUrls() {
    const shortenButton = document.querySelector('button[onclick="shortenAllUrls()"]');
    shortenButton.disabled = true;
    shortenButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Shortening...';

    try {
      const response = await fetch('/shorten-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xray: document.getElementById('xrayLink').value,
          singbox: document.getElementById('singboxLink').value,
          clash: document.getElementById('clashLink').value
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        document.getElementById('xrayLink').value = data.xrayShortUrl;
        document.getElementById('singboxLink').value = data.singboxShortUrl;
        document.getElementById('clashLink').value = data.clashShortUrl;
      } else {
        console.error('Failed to shorten URLs');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      shortenButton.disabled = false;
      shortenButton.innerHTML = '<i class="fas fa-compress-alt me-2"></i>Shorten Your Subscribe links';
    }
  }
`;

const darkModeToggleFunction = () => `
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;

  darkModeToggle.addEventListener('click', () => {
    body.setAttribute('data-theme', body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    darkModeToggle.innerHTML = body.getAttribute('data-theme') === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const systemDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    darkModeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  } else if (systemDarkMode) {
    body.setAttribute('data-theme', 'dark');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Save theme preference when changed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        localStorage.setItem('theme', body.getAttribute('data-theme'));
      }
    });
  });

  observer.observe(body, { attributes: true });
`;

export function generateHtml(xrayUrl, singboxUrl, clashUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      ${generateHead()}
      ${generateBody(xrayUrl, singboxUrl, clashUrl)}
    </html>
  `;
}

const generateRuleSetSelection = () => `
  <div class="mt-3">
    <h4 class="mb-3">Select Rules:</h4>
    <p class="explanation-text mb-3">
      Choose which routing rules to apply to your configuration. These rules determine how traffic is directed through different proxies or directly. If you're unsure, you can leave the default rules selected.
    </p>
    <div class="row">
      ${UNIFIED_RULES.map(rule => `
        <div class="col-md-4 mb-2">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${rule.name}" id="${rule.name}" name="selectedRules" ${isDefaultRule(rule.name) ? 'checked' : ''}>
            <label class="form-check-label" for="${rule.name}">${rule.name}</label>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
`;

const isDefaultRule = (ruleName) => {
  const defaultRules = ['广告拦截', '谷歌服务', '国内服务', '电报消息'];
  return defaultRules.includes(ruleName);
};
