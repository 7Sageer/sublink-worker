import { UNIFIED_RULES, PREDEFINED_RULE_SETS } from './config.js';
import { generateStyles } from './style.js';
import { t } from './i18n/index.js';

export function generateHtml(xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      ${generateHead()}
      ${generateBody(xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl)}
    </html>
  `;
}

const generateHead = () => `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${t('pageDescription')}">
    <meta name="keywords" content="${t('pageKeywords')}">
    <title>${t('pageTitle')}</title>
    <meta property="og:title" content="${t('ogTitle')}">
    <meta property="og:description" content="${t('ogDescription')}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://sublink-worker.sageer.me/">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
    <style>
      ${generateStyles()}
    </style>
  </head>
`;

const generateBody = (xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl) => `
  <body>
    ${generateDarkModeToggle()}
    ${generateGithubLink()}
    <div class="container mt-5">
      <div class="card mb-5">
        ${generateCardHeader()}
        <div class="card-body">
          ${generateForm()}
          <div id="subscribeLinksContainer">
            ${generateSubscribeLinks(xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl)}
          </div>
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

// Form Components
const generateForm = () => `
  <form method="POST" id="encodeForm">
    ${generateShareUrlsSection()}
    ${generateAdvancedOptionsToggle()}
    ${generateAdvancedOptions()}
    ${generateButtonContainer()}
  </form>
`;

const generateShareUrlsSection = () => `
  <div class="form-section">
    <div class="form-section-title">${t('shareUrls')}</div>
    <textarea class="form-control" id="inputTextarea" name="input" required placeholder="${t('urlPlaceholder')}" rows="3"></textarea>
  </div>
`;

const generateAdvancedOptionsToggle = () => `
  <div class="form-check form-switch mb-3">
    <input class="form-check-input" type="checkbox" id="advancedToggle">
    <label class="form-check-label" for="advancedToggle">${t('advancedOptions')}</label>
  </div>
`;

const generateAdvancedOptions = () => `
  <div id="advancedOptions">
    ${generateRuleSetSelection()}
    ${generateBaseConfigSection()}
    ${generateUASection()}
  </div>
`;

const generateButtonContainer = () => `
  <div class="button-container d-flex gap-2 mt-4">
    <button type="submit" class="btn btn-primary flex-grow-1">
      <i class="fas fa-sync-alt me-2"></i>${t('convert')}
    </button>
    <button type="button" class="btn btn-outline-secondary" id="clearFormBtn">
      <i class="fas fa-trash-alt me-2"></i>${t('clear')}
    </button>
  </div>
`;

const generateSubscribeLinks = (xrayUrl, singboxUrl, clashUrl, surgeUrl, baseUrl) => `
  <div class="mt-4">
    ${generateLinkInput('Xray Link (Base64):', 'xrayLink', xrayUrl)}
    ${generateLinkInput('SingBox Link:', 'singboxLink', singboxUrl)}
    ${generateLinkInput('Clash Link:', 'clashLink', clashUrl)}
    ${generateLinkInput('Surge Link:', 'surgeLink', surgeUrl)}
    ${generateCustomPathSection(baseUrl)}
    ${generateShortenButton()}
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
      <button class="btn btn-outline-secondary" type="button" onclick="generateQRCode('${id}')">
        <i class="fas fa-qrcode"></i>
      </button>
    </div>
  </div>
`;

const generateCustomPathSection = (baseUrl) => `
  <div class="mb-4 mt-3">
    <label for="customShortCode" class="form-label">${t('customPath')}</label>
    <div class="input-group flex-nowrap">
      <span class="input-group-text text-truncate" style="max-width: 400px;" title="${baseUrl}/s/">
        ${baseUrl}/s/
      </span>
      <input type="text" class="form-control" id="customShortCode" placeholder="e.g. my-custom-link">
      <select id="savedCustomPaths" class="form-select" style="max-width: 200px;">
        <option value="">${t('savedPaths')}</option>
      </select>
      <button class="btn btn-outline-danger" type="button" onclick="deleteSelectedPath()">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  </div>
`;

const generateShortenButton = () => `
  <div class="d-grid mt-3">
    <button class="btn btn-primary btn-lg" type="button" onclick="shortenAllUrls()">
      <i class="fas fa-compress-alt me-2"></i>${t('shortenLinks')}
    </button>
  </div>
`;

const generateScripts = () => `
  <script>
    ${copyToClipboardFunction()}
    ${shortenAllUrlsFunction()}
    ${darkModeToggleFunction()}
    ${advancedOptionsToggleFunction()}
    ${applyPredefinedRulesFunction()}
    ${tooltipFunction()}
    ${submitFormFunction()}
    ${customRuleFunctions()}
    ${generateQRCodeFunction()}
    ${customPathFunctions()}
    ${saveConfig()}
    ${clearConfig()}
  </script>
`;

const customPathFunctions = () => `
  function saveCustomPath() {
    const customPath = document.getElementById('customShortCode').value;
    if (customPath) {
      let savedPaths = JSON.parse(localStorage.getItem('savedCustomPaths') || '[]');
      if (!savedPaths.includes(customPath)) {
        savedPaths.push(customPath);
        localStorage.setItem('savedCustomPaths', JSON.stringify(savedPaths));
        updateSavedPathsDropdown();
      }
    }
  }

  function updateSavedPathsDropdown() {
    const savedPaths = JSON.parse(localStorage.getItem('savedCustomPaths') || '[]');
    const dropdown = document.getElementById('savedCustomPaths');
    dropdown.innerHTML = '<option value="">Saved paths</option>';
    savedPaths.forEach(path => {
      const option = document.createElement('option');
      option.value = path;
      option.textContent = path;
      dropdown.appendChild(option);
    });
  }

  function loadSavedCustomPath() {
    const dropdown = document.getElementById('savedCustomPaths');
    const customShortCode = document.getElementById('customShortCode');
    if (dropdown.value) {
      customShortCode.value = dropdown.value;
    }
  }

  function deleteSelectedPath() {
    const dropdown = document.getElementById('savedCustomPaths');
    const selectedPath = dropdown.value;
    if (selectedPath) {
      let savedPaths = JSON.parse(localStorage.getItem('savedCustomPaths') || '[]');
      savedPaths = savedPaths.filter(path => path !== selectedPath);
      localStorage.setItem('savedCustomPaths', JSON.stringify(savedPaths));
      updateSavedPathsDropdown();
      document.getElementById('customShortCode').value = '';
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateSavedPathsDropdown();
    document.getElementById('savedCustomPaths').addEventListener('change', loadSavedCustomPath);
  });
`;

const advancedOptionsToggleFunction = () => `
  document.getElementById('advancedToggle').addEventListener('change', function() {
    const advancedOptions = document.getElementById('advancedOptions');
    if (this.checked) {
      advancedOptions.classList.add('show');
    } else {
      advancedOptions.classList.remove('show');
    }
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
  let isShortening = false;

  async function shortenUrl(url, customShortCode) {
    saveCustomPath();
    const response = await fetch(\`/shorten-v2?url=\${encodeURIComponent(url)}&shortCode=\${encodeURIComponent(customShortCode || '')}\`);
    if (response.ok) {
      const data = await response.text();
      return data;
    }
    throw new Error('Failed to shorten URL');
  }

  async function shortenAllUrls() {
    if (isShortening) {
      return;
    }

    const shortenButton = document.querySelector('button[onclick="shortenAllUrls()"]');
    
    try {
      isShortening = true;
      shortenButton.disabled = true;
      shortenButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Shortening...';

      const singboxLink = document.getElementById('singboxLink');
      const customShortCode = document.getElementById('customShortCode').value;

      if (singboxLink.value.includes('/b/')) {
        alert('Links are already shortened!');
        return;
      }

      const shortCode = await shortenUrl(singboxLink.value, customShortCode);

      const xrayLink = document.getElementById('xrayLink');
      const clashLink = document.getElementById('clashLink');
      const surgeLink = document.getElementById('surgeLink');

      xrayLink.value = window.location.origin + '/x/' + shortCode;
      singboxLink.value = window.location.origin + '/b/' + shortCode;
      clashLink.value = window.location.origin + '/c/' + shortCode;
      surgeLink.value = window.location.origin + '/s/' + shortCode;
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to shorten URLs. Please try again.');
    } finally {
      isShortening = false;
      shortenButton.disabled = false;
      shortenButton.innerHTML = '<i class="fas fa-compress-alt me-2"></i>Shorten Links';
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

const generateRuleSetSelection = () => `
  <div class="form-section">
    <div class="form-section-title d-flex align-items-center">
      ${t('ruleSelection')}
      <span class="tooltip-icon ms-2">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('ruleSelectionTooltip')}
        </span>
      </span>
    </div>
    <div class="content-container mb-3">
      <select class="form-select" id="predefinedRules" onchange="applyPredefinedRules()">
        <option value="custom">${t('custom')}</option>
        <option value="minimal">${t('minimal')}</option>
        <option value="balanced">${t('balanced')}</option>
        <option value="comprehensive">${t('comprehensive')}</option>
      </select>
    </div>
    <div class="row" id="ruleCheckboxes">
      ${UNIFIED_RULES.map(rule => generateRuleCheckbox(rule)).join('')}
    </div>
    ${generateCustomRulesSection()}
  </div>
`;

const generateRuleCheckbox = (rule) => `
  <div class="col-md-4 mb-2">
    <div class="form-check">
      <input class="form-check-input rule-checkbox" type="checkbox" value="${rule.name}" id="${rule.name}" name="selectedRules">
      <label class="form-check-label" for="${rule.name}">${t('outboundNames.' + rule.name)}</label>
    </div>
  </div>
`;

const generateCustomRulesSection = () => `
  <div class="mt-2">
    <div class="custom-rules-section-header">
      <h5 class="custom-rules-section-title">${t('customRulesSection')}</h5>
      <span class="tooltip-icon">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('customRulesSectionTooltip')}
        </span>
      </span>
    </div>
    <div class="custom-rules-container">
      ${generateCustomRulesTabs()}
      ${generateCustomRulesContent()}
    </div>
  </div>
`;

const generateCustomRulesTabs = () => `
  <div class="custom-rules-tabs">
    <button type="button" class="custom-rules-tab active" onclick="switchCustomRulesTab('form')" id="formTab">
      <i class="fas fa-edit me-2"></i>${t('customRulesForm')}
    </button>
    <button type="button" class="custom-rules-tab" onclick="switchCustomRulesTab('json')" id="jsonTab">
      <i class="fas fa-code me-2"></i>${t('customRulesJSON')}
    </button>
  </div>
`;

const generateCustomRulesContent = () => `
  <div class="custom-rules-content">
    ${generateFormView()}
    ${generateJSONView()}
  </div>
`;

const generateFormView = () => `
  <div id="formView" class="custom-rules-view active">
    <div class="conversion-controls">
      <button type="button" class="btn btn-outline-primary btn-sm" onclick="addCustomRule()">
        <i class="fas fa-plus me-1"></i>${t('addCustomRule')}
      </button>
      <button type="button" class="btn btn-outline-danger btn-sm" onclick="clearAllCustomRules()">
        <i class="fas fa-trash me-1"></i>${t('clearAll')}
      </button>
    </div>
    <div id="customRules">
      <!-- Custom rules will be dynamically added here -->
    </div>
    <div id="emptyFormMessage" class="empty-state" style="display: none;">
      <i class="fas fa-plus-circle fa-2x mb-2"></i>
      <p>${t('noCustomRulesForm')}</p>
    </div>
  </div>
`;

const generateJSONView = () => `
  <div id="jsonView" class="custom-rules-view">
    <div class="conversion-controls">
      <button type="button" class="btn btn-outline-danger btn-sm" onclick="clearAllCustomRules()">
        <i class="fas fa-trash me-1"></i>${t('clearAll')}
      </button>
    </div>
    <div id="customRulesJSON">
      <div class="mb-2">
        <label class="form-label">${t('customRuleJSON')}</label>
        <div class="json-textarea-container">
          <textarea class="form-control json-textarea" name="customRuleJSON[]" rows="15"
                    oninput="validateJSONRealtime(this)"></textarea>
          <div class="json-validation-message" style="display: none;"></div>
        </div>
      </div>
    </div>
  </div>
`;

const generateBaseConfigSection = () => `
  <div class="form-section">
    <div class="form-section-title d-flex align-items-center">
      ${t('baseConfigSettings')}
      <span class="tooltip-icon ms-2">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('baseConfigTooltip')}
        </span>
      </span>
    </div>
    <div class="mb-3">
      <select class="form-select" id="configType">
        <option value="singbox">SingBox (JSON)</option>
        <option value="clash">Clash (YAML)</option>
      </select>
    </div>
    <div class="mb-3">
      <textarea class="form-control" id="configEditor" rows="3" placeholder="Paste your custom config here..."></textarea>
    </div>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-secondary" onclick="saveConfig()">${t('saveConfig')}</button>
      <button type="button" class="btn btn-outline-danger" onclick="clearConfig()">
        <i class="fas fa-trash-alt me-2"></i>${t('clearConfig')}
      </button>
    </div>
  </div>
`;

const generateUASection = () => `
  <div class="form-section">
    <div class="form-section-title d-flex align-items-center">
      ${t('UASettings')}
      <span class="tooltip-icon ms-2">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          ${t('UAtip')}
        </span>
      </span>
    </div>
    <input type="text" class="form-control" id="customUA" placeholder="curl/7.74.0">
  </div>
`;

const applyPredefinedRulesFunction = () => `
  function applyPredefinedRules() {
    const predefinedRules = document.getElementById('predefinedRules').value;
    const checkboxes = document.querySelectorAll('.rule-checkbox');
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    if (predefinedRules === 'custom') {
      return;
    }

    const rulesToApply = ${JSON.stringify(PREDEFINED_RULE_SETS)};
    
    rulesToApply[predefinedRules].forEach(rule => {
      const checkbox = document.getElementById(rule);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
  }

  // Add event listeners to checkboxes
  document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.rule-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const predefinedSelect = document.getElementById('predefinedRules');
        if (predefinedSelect.value !== 'custom') {
          predefinedSelect.value = 'custom';
        }
      });
    });
  });
`;

const tooltipFunction = () => `
  function initTooltips() {
    const tooltips = document.querySelectorAll('.tooltip-icon');
    tooltips.forEach(tooltip => {
      tooltip.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = tooltip.querySelector('.tooltip-content');
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      });
    });

    document.addEventListener('click', () => {
      const openTooltips = document.querySelectorAll('.tooltip-content[style="display: block;"]');
      openTooltips.forEach(tooltip => {
        tooltip.style.display = 'none';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initTooltips);
`;

const submitFormFunction = () => `
  function submitForm(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const inputString = formData.get('input');

    const userAgent = document.getElementById('customUA').value;
    
    // Save form data to localStorage
    localStorage.setItem('inputTextarea', inputString);
    localStorage.setItem('advancedToggle', document.getElementById('advancedToggle').checked);

    // Save UserAgent data to localStorage
    localStorage.setItem('userAgent', document.getElementById('customUA').value);
    
    // Save configEditor and configType to localStorage
    localStorage.setItem('configEditor', document.getElementById('configEditor').value);
    localStorage.setItem('configType', document.getElementById('configType').value);
    
    let selectedRules;
    const predefinedRules = document.getElementById('predefinedRules').value;
    if (predefinedRules !== 'custom') {
      selectedRules = predefinedRules;
    } else {
      selectedRules = Array.from(document.querySelectorAll('input[name="selectedRules"]:checked'))
        .map(checkbox => checkbox.value);
    }
    
    const configEditor = document.getElementById('configEditor');
    const configId = new URLSearchParams(window.location.search).get('configId') || '';

    const customRules = parseCustomRules();

    const configParam = configId ? \`&configId=\${configId}\` : '';
    const xrayUrl = \`\${window.location.origin}/xray?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}\${configParam}\`;
    const singboxUrl = \`\${window.location.origin}/singbox?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}\${configParam}\`;
    const clashUrl = \`\${window.location.origin}/clash?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}\${configParam}\`;
    const surgeUrl = \`\${window.location.origin}/surge?config=\${encodeURIComponent(inputString)}&ua=\${encodeURIComponent(userAgent)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}\${configParam}\`;
    document.getElementById('xrayLink').value = xrayUrl;
    document.getElementById('singboxLink').value = singboxUrl;
    document.getElementById('clashLink').value = clashUrl;
    document.getElementById('surgeLink').value = surgeUrl;
    // Show the subscribe part
    const subscribeLinksContainer = document.getElementById('subscribeLinksContainer');
    subscribeLinksContainer.classList.remove('hide');
    subscribeLinksContainer.classList.add('show');

    // Scroll to the subscribe part
    subscribeLinksContainer.scrollIntoView({ behavior: 'smooth' });
  }

  function parseUrlAndFillForm(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Parse base configuration
      const config = params.get('config');
      if (config) {
        const decodedConfig = decodeURIComponent(config);
        document.getElementById('inputTextarea').value = decodedConfig;
      }

      // Parse UserAgent
      const ua = params.get('ua');
      if (ua) {
        document.getElementById('customUA').value = decodeURIComponent(ua);
      }

      // Parse rule selection
      const selectedRules = params.get('selectedRules');
      if (selectedRules) {
        try {
          const decodedRules = decodeURIComponent(selectedRules).replace(/^"|"$/g, '');
          // Check if it's a predefined rule set
          if (['minimal', 'balanced', 'comprehensive'].includes(decodedRules)) {
            const predefinedRules = document.getElementById('predefinedRules');
            predefinedRules.value = decodedRules;
            // Apply predefined rules to checkboxes
            const rulesToApply = ${JSON.stringify(PREDEFINED_RULE_SETS)};
            const checkboxes = document.querySelectorAll('.rule-checkbox');
            checkboxes.forEach(checkbox => {
              checkbox.checked = rulesToApply[decodedRules].includes(checkbox.value);
            });
          } else {
            // Handle custom rules (JSON array)
            const rules = JSON.parse(decodedRules);
            if (Array.isArray(rules)) {
              document.getElementById('predefinedRules').value = 'custom';
              const checkboxes = document.querySelectorAll('.rule-checkbox');
              checkboxes.forEach(checkbox => {
                checkbox.checked = rules.includes(checkbox.value);
              });
            }
          }
        } catch (e) {
          console.error('Error parsing selected rules:', e);
        }
      }

      // Parse custom rules
      const customRules = params.get('customRules');
      if (customRules) {
        try {
          const rules = JSON.parse(decodeURIComponent(customRules));
          if (Array.isArray(rules) && rules.length > 0) {
            // Clear existing custom rules
            document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());
            
            // Switch to JSON view and write rules
            switchCustomRulesTab('json');
            const jsonTextarea = document.querySelector('#customRulesJSON textarea');
            if (jsonTextarea) {
              jsonTextarea.value = JSON.stringify(rules, null, 2);
              validateJSONRealtime(jsonTextarea);
            }
          }
        } catch (e) {
          console.error('Error parsing custom rules:', e);
        }
      }

      // Parse configuration ID
      const configId = params.get('configId');
      if (configId) {
        // Fetch configuration content
        fetch(\`/config?type=singbox&id=\${configId}\`)
          .then(response => response.json())
          .then(data => {
            if (data.content) {
              document.getElementById('configEditor').value = data.content;
              document.getElementById('configType').value = data.type || 'singbox';
            }
          })
          .catch(error => console.error('Error fetching config:', error));
      }

      // Show advanced options
      document.getElementById('advancedToggle').checked = true;
      document.getElementById('advancedOptions').classList.add('show');
    } catch (e) {
      console.error('Error parsing URL:', e);
    }
  }

  // 检测是否是短链
  function isShortUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts.length >= 3 && ['b', 'c', 'x', 's'].includes(pathParts[1]) && pathParts[2];
    } catch (error) {
      return false;
    }
  }

  // 自动解析短链
  async function autoResolveShortUrl(shortUrl) {
    try {
      const response = await fetch(\`/resolve?url=\${encodeURIComponent(shortUrl)}\`);
      
      if (response.ok) {
        const data = await response.json();
        const originalUrl = data.originalUrl;
        
        // 用原始URL替换输入框中的短链
        document.getElementById('inputTextarea').value = originalUrl;
        
        // 解析原始URL到表单
        parseUrlAndFillForm(originalUrl);
        
        return true;
      } else {
        console.error('Failed to resolve short URL:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error resolving short URL:', error);
      return false;
    }
  }

  // Add input box event listener
  document.addEventListener('DOMContentLoaded', function() {
    const inputTextarea = document.getElementById('inputTextarea');
    let lastValue = '';
    
    inputTextarea.addEventListener('input', async function() {
      const currentValue = this.value.trim();
      
      if (currentValue && currentValue !== lastValue) {
        // 首先检查是否是短链
        if (isShortUrl(currentValue)) {
          await autoResolveShortUrl(currentValue);
        }
        // 然后检查是否是项目生成的完整链接
        else if (currentValue.includes('/singbox?') || 
                 currentValue.includes('/clash?') || 
                 currentValue.includes('/surge?') || 
                 currentValue.includes('/xray?')) {
          parseUrlAndFillForm(currentValue);
        }
      }
      
      lastValue = currentValue;
    });
  });

  function loadSavedFormData() {
    const savedInput = localStorage.getItem('inputTextarea');
    if (savedInput) {
      document.getElementById('inputTextarea').value = savedInput;
    }

    const advancedToggle = localStorage.getItem('advancedToggle');
    if (advancedToggle) {
      document.getElementById('advancedToggle').checked = advancedToggle === 'true';
      if (advancedToggle === 'true') {
        document.getElementById('advancedOptions').classList.add('show');
      }
    }
    
    // Load userAgent
    const savedUA = localStorage.getItem('userAgent');
    if (savedUA) {
      document.getElementById('customUA').value = savedUA;
    }
    
    // Load configEditor and configType
    const savedConfig = localStorage.getItem('configEditor');
    const savedConfigType = localStorage.getItem('configType');
    
    if (savedConfig) {
      document.getElementById('configEditor').value = savedConfig;
    }
    if (savedConfigType) {
      document.getElementById('configType').value = savedConfigType;
    }
    
    const savedCustomPath = localStorage.getItem('customPath');
    if (savedCustomPath) {
      document.getElementById('customShortCode').value = savedCustomPath;
    }

    loadSelectedRules();
  }

  function saveSelectedRules() {
    const selectedRules = Array.from(document.querySelectorAll('input[name="selectedRules"]:checked'))
      .map(checkbox => checkbox.value);
    localStorage.setItem('selectedRules', JSON.stringify(selectedRules));
    localStorage.setItem('predefinedRules', document.getElementById('predefinedRules').value);
  }

  function loadSelectedRules() {
    const savedRules = localStorage.getItem('selectedRules');
    if (savedRules) {
      const rules = JSON.parse(savedRules);
      rules.forEach(rule => {
        const checkbox = document.querySelector(\`input[name="selectedRules"][value="\${rule}"]\`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }

    const savedPredefinedRules = localStorage.getItem('predefinedRules');
    if (savedPredefinedRules) {
      document.getElementById('predefinedRules').value = savedPredefinedRules;
    }
  }

  function clearFormData() {
    localStorage.removeItem('inputTextarea');
    localStorage.removeItem('advancedToggle');
    localStorage.removeItem('selectedRules');
    localStorage.removeItem('predefinedRules');
    localStorage.removeItem('configEditor'); 
    localStorage.removeItem('configType');
    localStorage.removeItem('userAgent');
    
    document.getElementById('inputTextarea').value = '';
    document.getElementById('advancedToggle').checked = false;
    document.getElementById('advancedOptions').classList.remove('show');
    document.getElementById('configEditor').value = '';
    document.getElementById('configType').value = 'singbox'; 
    document.getElementById('customUA').value = '';
    
    localStorage.removeItem('customPath');
    document.getElementById('customShortCode').value = '';

    const subscribeLinksContainer = document.getElementById('subscribeLinksContainer');
    subscribeLinksContainer.classList.remove('show');
    subscribeLinksContainer.classList.add('hide');

    document.getElementById('xrayLink').value = '';
    document.getElementById('singboxLink').value = '';
    document.getElementById('clashLink').value = '';

    // wait to reset the container
    setTimeout(() => {
      subscribeLinksContainer.classList.remove('hide');
    }, 500);
  }

  document.addEventListener('DOMContentLoaded', function() {
    loadSavedFormData();
    document.getElementById('encodeForm').addEventListener('submit', submitForm);
    document.getElementById('clearFormBtn').addEventListener('click', clearFormData);
  });
`;

const customRuleFunctions = () => `
  let customRuleCount = 0;
  let currentTab = 'form';

  function switchCustomRulesTab(tab) {
    try {
      currentTab = tab;

      // Update tab buttons
      document.querySelectorAll('.custom-rules-tab').forEach(btn => btn.classList.remove('active'));
      document.getElementById(tab + 'Tab').classList.add('active');

      // Update views
      document.querySelectorAll('.custom-rules-view').forEach(view => view.classList.remove('active'));
      document.getElementById(tab + 'View').classList.add('active');

      // Automatic view conversion
      if (tab === 'json') {
        convertFormToJSON();
      } else {
        convertJSONToForm();
      }

      updateEmptyMessages();
    } catch (error) {
      console.error('Error switching tabs:', error);
      // Ensure the view is correctly displayed if an error occurs during the switch
      document.querySelectorAll('.custom-rules-view').forEach(view => view.classList.remove('active'));
      document.getElementById(tab + 'View').classList.add('active');
    }
  }

  function updateEmptyMessages() {
    const hasFormRules = document.querySelectorAll('.custom-rule').length > 0;
    document.getElementById('emptyFormMessage').style.display = hasFormRules ? 'none' : 'block';
  }

  function addCustomRule() {
    const customRulesDiv = document.getElementById('customRules');
    const newRuleDiv = document.createElement('div');
    newRuleDiv.className = 'custom-rule mb-3 p-3 border rounded';
    newRuleDiv.dataset.ruleId = customRuleCount++;
    newRuleDiv.innerHTML = \`
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">${t('customRule')} #\${getNextRuleNumber()}</h6>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeRule(this)">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="row">
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleOutboundName')}</label>
          <input type="text" class="form-control" name="customRuleName[]" placeholder="${t('customRuleOutboundName')}" required>
        </div>
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleGeoSite')}</label>
          <span class="tooltip-icon">
            <i class="fas fa-question-circle"></i>
            <span class="tooltip-content">
              ${t('customRuleGeoSiteTooltip')}
            </span>
          </span>
          <input type="text" class="form-control" name="customRuleSite[]" placeholder="${t('customRuleGeoSitePlaceholder')}">
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleGeoIP')}</label>
          <span class="tooltip-icon">
            <i class="fas fa-question-circle"></i>
            <span class="tooltip-content">
              ${t('customRuleGeoIPTooltip')}
            </span>
          </span>
          <input type="text" class="form-control" name="customRuleIP[]" placeholder="${t('customRuleGeoIPPlaceholder')}">
        </div>
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleDomainSuffix')}</label>
          <input type="text" class="form-control" name="customRuleDomainSuffix[]" placeholder="${t('customRuleDomainSuffixPlaceholder')}">
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleDomainKeyword')}</label>
          <input type="text" class="form-control" name="customRuleDomainKeyword[]" placeholder="${t('customRuleDomainKeywordPlaceholder')}">
        </div>
        <div class="col-md-6 mb-2">
          <label class="form-label">${t('customRuleIPCIDR')}</label>
          <input type="text" class="form-control" name="customRuleIPCIDR[]" placeholder="${t('customRuleIPCIDRPlaceholder')}">
        </div>
      </div>
      <div class="mb-2">
        <label class="form-label">${t('customRuleProtocol')}</label>
        <span class="tooltip-icon">
          <i class="fas fa-question-circle"></i>
          <span class="tooltip-content">
            ${t('customRuleProtocolTooltip')}
          </span>
        </span>
        <input type="text" class="form-control" name="customRuleProtocol[]" placeholder="${t('customRuleProtocolPlaceholder')}">
      </div>
    \`;
    customRulesDiv.appendChild(newRuleDiv);
    updateEmptyMessages();

    // Switch to form tab if not already there
    if (currentTab !== 'form') {
      switchCustomRulesTab('form');
    }
  }

  function clearAllCustomRules() {
    if (confirm('${t('confirmClearAllRules')}')) {
      document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());
      document.querySelectorAll('.custom-rule-json').forEach(rule => rule.remove());
      customRuleCount = 0; 
      updateEmptyMessages();
    }
  }

  // Add a function to get the next rule number
  function getNextRuleNumber() {
    const existingRules = document.querySelectorAll('.custom-rule');
    return existingRules.length + 1;
  }

  // Modify the remove rule function to update the sequence number
  function removeRule(button) {
    const ruleDiv = button.closest('.custom-rule, .custom-rule-json');
    if (ruleDiv) {
      ruleDiv.remove();
      // Update the sequence number of the remaining rules
      document.querySelectorAll('.custom-rule').forEach((rule, index) => {
        const titleElement = rule.querySelector('h6');
        if (titleElement) {
          titleElement.textContent = \`${t('customRule')} #\${index + 1}\`;
        }
      });
      updateEmptyMessages();
    }
  }

  function convertFormToJSON() {
    const formRules = [];
    document.querySelectorAll('.custom-rule').forEach(rule => {
      const ruleData = {
        name: rule.querySelector('input[name="customRuleName[]"]').value || '',
        site: rule.querySelector('input[name="customRuleSite[]"]').value || '',
        ip: rule.querySelector('input[name="customRuleIP[]"]').value || '',
        domain_suffix: rule.querySelector('input[name="customRuleDomainSuffix[]"]').value || '',
        domain_keyword: rule.querySelector('input[name="customRuleDomainKeyword[]"]').value || '',
        ip_cidr: rule.querySelector('input[name="customRuleIPCIDR[]"]').value || '',
        protocol: rule.querySelector('input[name="customRuleProtocol[]"]').value || ''
      };

      // Only add rules that have at least a name
      if (ruleData.name.trim()) {
        formRules.push(ruleData);
      }
    });

    // Update JSON editor content
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (jsonTextarea) {
      jsonTextarea.value = JSON.stringify(formRules, null, 2);
      validateJSONRealtime(jsonTextarea);
    }
  }

  function convertJSONToForm() {
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (!jsonTextarea || !jsonTextarea.value.trim()) {
      return;
    }

    try {
      const rules = JSON.parse(jsonTextarea.value.trim());
      if (!Array.isArray(rules)) {
        throw new Error('${t('mustBeArray')}');
      }

      // Clear existing form rules
      document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());

      // Convert each JSON rule to form
      rules.forEach((ruleData, index) => {
        if (ruleData && ruleData.name) {
          const customRulesDiv = document.getElementById('customRules');
          const newRuleDiv = document.createElement('div');
          newRuleDiv.className = 'custom-rule mb-3 p-3 border rounded';
          newRuleDiv.innerHTML = \`
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">${t('customRule')} #\${index + 1}</h6>
              <button type="button" class="btn btn-danger btn-sm" onclick="removeRule(this)">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleOutboundName')}</label>
                <input type="text" class="form-control" name="customRuleName[]" value="\${ruleData.name || ''}" required>
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleGeoSite')}</label>
                <input type="text" class="form-control" name="customRuleSite[]" value="\${ruleData.site || ''}">
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleGeoIP')}</label>
                <input type="text" class="form-control" name="customRuleIP[]" value="\${ruleData.ip || ''}">
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleDomainSuffix')}</label>
                <input type="text" class="form-control" name="customRuleDomainSuffix[]" value="\${ruleData.domain_suffix || ''}">
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleDomainKeyword')}</label>
                <input type="text" class="form-control" name="customRuleDomainKeyword[]" value="\${ruleData.domain_keyword || ''}">
              </div>
              <div class="col-md-6 mb-2">
                <label class="form-label">${t('customRuleIPCIDR')}</label>
                <input type="text" class="form-control" name="customRuleIPCIDR[]" value="\${ruleData.ip_cidr || ''}">
              </div>
            </div>
            <div class="mb-2">
              <label class="form-label">${t('customRuleProtocol')}</label>
              <input type="text" class="form-control" name="customRuleProtocol[]" value="\${ruleData.protocol || ''}">
            </div>
          \`;
          customRulesDiv.appendChild(newRuleDiv);
        }
      });
    } catch (error) {
      console.error('Error converting JSON to form:', error);
      // If an error occurs during the conversion, clear the form view
      document.querySelectorAll('.custom-rule').forEach(rule => rule.remove());
    }

    updateEmptyMessages();
  }

  function validateJSONRealtime(textarea) {
    const messageDiv = textarea.parentNode.querySelector('.json-validation-message');
    const jsonText = textarea.value.trim();
    // Clear previous validation state
    textarea.classList.remove('json-valid', 'json-invalid');
    messageDiv.style.display = 'none';
    messageDiv.classList.remove('valid', 'invalid');
    if (!jsonText) {
      return; // Don't validate empty textarea
    }
    try {
      const rules = JSON.parse(jsonText);
      if (!Array.isArray(rules)) {
        throw new Error('${t('mustBeArray')}');
      }
      const errors = [];
      rules.forEach((ruleData, ruleIndex) => {
        if (!ruleData.name || !ruleData.name.trim()) {
          errors.push(\`${t('rule')} #\${ruleIndex + 1}: ${t('nameRequired')}\`);
        }
      });
      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }
      // Valid JSON
      textarea.classList.add('json-valid');
      messageDiv.textContent = \`✓ ${t('validJSON')} (\${rules.length} ${t('rules')})\`;
      messageDiv.classList.add('valid');
      messageDiv.style.display = 'block';
    } catch (error) {
      // Invalid JSON
      textarea.classList.add('json-invalid');
      messageDiv.textContent = \`✗ \${error.message}\`;
      messageDiv.classList.add('invalid');
      messageDiv.style.display = 'block';
    }
  }

  function validateJSON() {
    let allValid = true;
    let errorMessages = [];
    document.querySelectorAll('.custom-rule-json').forEach((rule, index) => {
      const textarea = rule.querySelector('textarea[name="customRuleJSON[]"]');
      validateJSONRealtime(textarea);
      if (textarea.classList.contains('json-invalid')) {
        allValid = false;
        const messageDiv = textarea.parentNode.querySelector('.json-validation-message');
        errorMessages.push(\`JSON #\${index + 1}: \${messageDiv.textContent.replace('✗ ', '')}\`);
      }
    });
    if (allValid) {
      alert('${t('allJSONValid')}');
    } else {
      alert('${t('jsonValidationErrors')}:\\n\\n' + errorMessages.join('\\n'));
    }
  }

  function parseCustomRules() {
    const customRules = [];

    // Process ordinary form rules
    document.querySelectorAll('.custom-rule').forEach(rule => {
      const ruleData = {
        name: rule.querySelector('input[name="customRuleName[]"]').value || '',
        site: rule.querySelector('input[name="customRuleSite[]"]').value || '',
        ip: rule.querySelector('input[name="customRuleIP[]"]').value || '',
        domain_suffix: rule.querySelector('input[name="customRuleDomainSuffix[]"]').value || '',
        domain_keyword: rule.querySelector('input[name="customRuleDomainKeyword[]"]').value || '',
        ip_cidr: rule.querySelector('input[name="customRuleIPCIDR[]"]').value || '',
        protocol: rule.querySelector('input[name="customRuleProtocol[]"]').value || ''
      };

      if (ruleData.name.trim()) {
        customRules.push(ruleData);
      }
    });

    // Process JSON rules
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (jsonTextarea && jsonTextarea.value.trim()) {
      try {
        const jsonRules = JSON.parse(jsonTextarea.value.trim());
        if (Array.isArray(jsonRules)) {
          customRules.push(...jsonRules.filter(r => r.name && r.name.trim()));
        }
      } catch (error) {
        console.error('Error parsing JSON rules:', error);
      }
    }

    return customRules;
  }

  // Initialize interface state
  document.addEventListener('DOMContentLoaded', function() {
    updateEmptyMessages();

    // Initialize real-time validation for JSON textarea
    const jsonTextarea = document.querySelector('#customRulesJSON textarea');
    if (jsonTextarea && jsonTextarea.value.trim()) {
      validateJSONRealtime(jsonTextarea);
    }

    // Initialize tooltips for dynamically added content
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.querySelectorAll) {
              initTooltips();
            }
          });
        }
      });
    });

    observer.observe(document.getElementById('customRules'), { childList: true, subtree: true });
  });

  function addCustomRuleJSON() {
    const customRulesJSONDiv = document.getElementById('customRulesJSON');
    const newRuleDiv = document.createElement('div');
    newRuleDiv.className = 'custom-rule-json mb-3 p-3 border rounded';
    newRuleDiv.dataset.ruleId = customRuleCount++;
    newRuleDiv.innerHTML = \`
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">${t('customRuleJSON')}</h6>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeRule(this)">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="mb-2">
        <label class="form-label">${t('customRuleJSON')}</label>
        <div class="json-textarea-container">
          <textarea class="form-control json-textarea" name="customRuleJSON[]" rows="15"
                    oninput="validateJSONRealtime(this)"></textarea>
          <div class="json-validation-message" style="display: none;"></div>
        </div>
      </div>
    \`;
    customRulesJSONDiv.appendChild(newRuleDiv);
    updateEmptyMessages();
  }
`;

const generateQRCodeFunction = () => `
  function generateQRCode(id) {
    const input = document.getElementById(id);
    const text = input.value;
    if (!text) {
      alert('No link provided!');
      return;
    }
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const cellSize = Math.max(2, Math.min(8, Math.floor(300 / moduleCount)));
      const margin = Math.floor(cellSize * 0.5);

      const qrImage = qr.createDataURL(cellSize, margin);
      
      const modal = document.createElement('div');
      modal.className = 'qr-modal';
      modal.innerHTML = \`
        <div class="qr-card">
          <img src="\${qrImage}" alt="QR Code">
          <p>Scan QR Code</p>
        </div>
      \`;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeQRModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeQRModal();
        }
      });

      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
    } catch (error) {
      console.error('Error in generating:', error);
      alert('Try to use short links!');
    }
  }

  function closeQRModal() {
    const modal = document.querySelector('.qr-modal');
    if (modal) {
      modal.classList.remove('show');
      modal.addEventListener('transitionend', () => {
        document.body.removeChild(modal);
      }, { once: true });
    }
  }
`;

const saveConfig = () => `
  function saveConfig() {
    const configEditor = document.getElementById('configEditor');
    const configType = document.getElementById('configType').value;
    const config = configEditor.value;

    localStorage.setItem('configEditor', config);
    localStorage.setItem('configType', configType);
    
    fetch('/config?type=' + configType, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: configType,
        content: config
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      return response.text();
    })
    .then(configId => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('configId', configId);
      window.history.pushState({}, '', currentUrl);
      alert('Configuration saved successfully!');
    })
    .catch(error => {
      alert('Error: ' + error.message);
    });
  }
`;

const clearConfig = () => `
  function clearConfig() {
    document.getElementById('configEditor').value = '';
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('configId');
    window.history.pushState({}, '', currentUrl);
    localStorage.removeItem('configEditor');
  }
`;
