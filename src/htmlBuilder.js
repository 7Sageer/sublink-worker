import { UNIFIED_RULES, PREDEFINED_RULE_SETS } from './config.js';
import { generateStyles } from './style.js';

export function generateHtml(xrayUrl, singboxUrl, clashUrl, baseUrl) {
return `
<!DOCTYPE html>
<html lang="en">
${generateHead()}
${generateBody(xrayUrl, singboxUrl, clashUrl, baseUrl)}
</html>
`;
}

const generateHead = () => `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Sublink Worker是一款强大的在线订阅链接转换工具,支持V2Ray/Xray、SingBox、Clash等多种客户端，提供自定义规则和高效转换，帮助您轻松管理和优化代理节点。">
    <meta name="keywords" content="Sublink, Worker, 订阅链接, 代理, Xray, SingBox, Clash, V2Ray, 自定义规则, 在线, 订阅转换, 机场订阅, 节点管理, 节点解析">
    <title>Sublink Worker - 轻量高效的订阅转换工具 | 支持V2Ray/Xray、SingBox、Clash</title>
    <meta property="og:title" content="Sublink Worker - 轻量高效的订阅链接转换工具">
    <meta property="og:description" content="强大的在线订阅链接转换工具,支持多种代理协议和自定义规则">
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



const generateBody = (xrayUrl, singboxUrl, clashUrl, baseUrl) => `
  <body>
    ${generateDarkModeToggle()}
    ${generateGithubLink()}
    <div class="container mt-5">
      <div class="card mb-5">
        ${generateCardHeader()}
        <div class="card-body">
          ${generateForm()}
          <div id="subscribeLinksContainer">
            ${generateSubscribeLinks(xrayUrl, singboxUrl, clashUrl, baseUrl)}
          </div>
        </div>
      </div>
    </div>
    ${generateScripts()}
    <!-- Cloudflare Web Analytics -->
    <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "67ed5892c109479cb0baddfaa9249c4e"}'></script>
    <!-- End Cloudflare Web Analytics -->
  </body>
`;

const generateDarkModeToggle = () => `
<button id="darkModeToggle" class="btn btn-outline-secondary">
<i class="fas fa-moon"></i>
</button>
`;

const generateGithubLink = () => `
<a href="https://github.com/yixiu001/sublink-worker" target="_blank" rel="noopener noreferrer" class="github-link">
<i class="fab fa-github"></i>
</a>
`;

const generateCardHeader = () => `
  <div class="card-header text-center">
    <h1 class="display-4 mb-0">Sublink Worker 汉化版</h1>
  </div>
`;

const generateForm = () => `
  <form method="POST" id="encodeForm">
    <div class="form-section">
      <div class="form-section-title">订阅链接</div>
      <textarea class="form-control" id="inputTextarea" name="input" required placeholder="vmess://abcd..." rows="3"></textarea>
    </div>

    <div class="form-check form-switch mb-3">
      <input class="form-check-input" type="checkbox" id="advancedToggle">
      <label class="form-check-label" for="advancedToggle">高级选项</label>
    </div>

    <div id="advancedOptions">
      <div class="form-section">
        ${generateRuleSetSelection()}
      </div>

      <div class="form-section">
        <div class="form-section-title d-flex align-items-center">
          基本配置设置（可选）
          <span class="tooltip-icon ms-2">
            <i class="fas fa-question-circle"></i>
            <span class="tooltip-content">
              此功能是实验性的，可能无法按预期工作。您可以在此处粘贴自己的基本配置。转到 <a href="https://github.com/yixiu001/sublink-worker/blob/main/docs/base-config.md" target="_blank">文档</a> 了解更多信息。
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
          <textarea class="form-control" id="configEditor" rows="3" placeholder="将您的自定义配置粘贴到此处..."></textarea>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-secondary" onclick="saveConfig()">保存配置</button>
          <button type="button" class="btn btn-outline-danger" onclick="clearConfig()">
            <i class="fas fa-trash-alt me-2"></i>清除配置
          </button>
        </div>
      </div>
    </div>

    <div class="d-flex gap-2 mt-4">
      <button type="submit" class="btn btn-primary flex-grow-1">
        <i class="fas fa-sync-alt me-2"></i>转换
      </button>
      <button type="button" class="btn btn-outline-secondary" id="clearFormBtn">
        <i class="fas fa-trash-alt me-2"></i>清除
      </button>
    </div>
  </form>
`;

const generateSubscribeLinks = (xrayUrl, singboxUrl, clashUrl, baseUrl) => `
  <div class="mt-5">
    <h2 class="mb-4">您的订阅链接:</h2>
    ${generateLinkInput('v2ray 订阅:', 'xrayLink', xrayUrl)}
    ${generateLinkInput('SingBox 订阅:', 'singboxLink', singboxUrl)}
    ${generateLinkInput('Clash 订阅:', 'clashLink', clashUrl)}
    <div class="mb-3">
      <label for="customShortCode" class="form-label">自定义路径（可选）:</label>
      <div class="input-group flex-nowrap">
        <span class="input-group-text text-truncate" style="max-width: 400px;" title="${baseUrl}/s/">
          ${baseUrl}/s/
        </span>
        <input type="text" class="form-control" id="customShortCode" placeholder="e.g. my-custom-link">
        <select id="savedCustomPaths" class="form-select" style="max-width: 200px;">
          <option value="">保存的路径</option>
        </select>
        <button class="btn btn-outline-danger" type="button" onclick="deleteSelectedPath()">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
    <div class="d-grid">
      <button class="btn btn-primary btn-lg" type="button" onclick="shortenAllUrls()">
        <i class="fas fa-compress-alt me-2"></i>短链接
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
      <button class="btn btn-outline-secondary" type="button" onclick="generateQRCode('${id}')">
        <i class="fas fa-qrcode"></i>
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
    ${applyPredefinedRulesFunction()}
    ${tooltipFunction()}
    ${submitFormFunction()}
    ${customRuleFunctions}
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
dropdown.innerHTML = '<option value="">保存的路径</option>';
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
let isShortening = false; // Add flag to track shortening status

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
// Prevent multiple clicks
if (isShortening) {
return;
}

    const shortenButton = document.querySelector('button[onclick="shortenAllUrls()"]');
    
    try {
      isShortening = true;
      shortenButton.disabled = true;
      shortenButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>缩短...';

      const singboxLink = document.getElementById('singboxLink');
      const customShortCode = document.getElementById('customShortCode').value;

      // Check if links are already shortened
      if (singboxLink.value.includes('/b/')) {
        alert('链接已经缩短!');
        return;
      }

      const shortCode = await shortenUrl(singboxLink.value, customShortCode);

      const xrayLink = document.getElementById('xrayLink');
      const clashLink = document.getElementById('clashLink');

      xrayLink.value = window.location.origin + '/x/' + shortCode;
      singboxLink.value = window.location.origin + '/b/' + shortCode;
      clashLink.value = window.location.origin + '/c/' + shortCode;
    } catch (error) {
      console.error('Error:', error);
      alert('无法缩短 URL。请重试。');
    } finally {
      isShortening = false;
      shortenButton.disabled = false;
      shortenButton.innerHTML = '<i class="fas fa-compress-alt me-2"></i>短链接';
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
  <div class="container">
    <div class="header-container">
      <h4 class="header-title">规则选择</h4>
      <span class="tooltip-icon">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          这些规则确定如何通过不同的代理或直接引导流量。如果您不确定，可以使用预定义的规则集。
        </span>
      </span>
    </div>

    <div class="content-container mb-3">
      <select class="form-select" id="predefinedRules" onchange="applyPredefinedRules()">
        <option value="custom">自定义</option>
        <option value="minimal">轻量</option>
        <option value="balanced">常用</option>
        <option value="comprehensive">全部</option>
      </select>
    </div>
    <div class="row" id="ruleCheckboxes">
      ${UNIFIED_RULES.map(rule => `
        <div class="col-md-4 mb-2">
          <div class="form-check">
            <input class="form-check-input rule-checkbox" type="checkbox" value="${rule.name}" id="${rule.name}" name="selectedRules">
            <label class="form-check-label" for="${rule.name}">${rule.outbound}</label>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="mt-4">
      <h5>自定义规则</h5>
      <div class="form-check form-switch mb-3">
        <input class="form-check-input" type="checkbox" id="crpinToggle">
        <label class="form-check-label" for="crpinToggle">固定自定义规则</label>
      </div>
      <div id="customRules">
      <!-- Custom rules will be dynamically added here -->
    </div>
    <button type="button" class="btn btn-secondary mt-2" onclick="addCustomRule()">添加自定义规则</button>
  </div>
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

    // Save form data to localStorage
    localStorage.setItem('inputTextarea', inputString);
    localStorage.setItem('advancedToggle', document.getElementById('advancedToggle').checked);
    localStorage.setItem('crpinToggle', document.getElementById('crpinToggle').checked);
    
    // 保存 configEditor 和 configType 到 localStorage
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
    
    let pin = document.getElementById('crpinToggle').checked;
    const configEditor = document.getElementById('configEditor');
    const configId = new URLSearchParams(window.location.search).get('configId') || '';

    const customRules = Array.from(document.querySelectorAll('.custom-rule')).map(rule => ({
      site: rule.querySelector('input[name="customRuleSite[]"]').value,
      ip: rule.querySelector('input[name="customRuleIP[]"]').value,
      name: rule.querySelector('input[name="customRuleName[]"]').value,
      domain_suffix: rule.querySelector('input[name="customRuleDomainSuffix[]"]').value,
      domain_keyword: rule.querySelector('input[name="customRuleDomainKeyword[]"]').value,
      ip_cidr: rule.querySelector('input[name="customRuleIPCIDR[]"]').value
    }));

    const configParam = configId ? \`&configId=\${configId}\` : '';
    const xrayUrl = \`\${window.location.origin}/xray?config=\${encodeURIComponent(inputString)}\${configParam}\`;
    const singboxUrl = \`\${window.location.origin}/singbox?config=\${encodeURIComponent(inputString)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}&pin=\${pin}\${configParam}\`;
    const clashUrl = \`\${window.location.origin}/clash?config=\${encodeURIComponent(inputString)}&selectedRules=\${encodeURIComponent(JSON.stringify(selectedRules))}&customRules=\${encodeURIComponent(JSON.stringify(customRules))}&pin=\${pin}\${configParam}\`;

    document.getElementById('xrayLink').value = xrayUrl;
    document.getElementById('singboxLink').value = singboxUrl;
    document.getElementById('clashLink').value = clashUrl;

    // Show the subscribe part
    const subscribeLinksContainer = document.getElementById('subscribeLinksContainer');
    subscribeLinksContainer.classList.remove('hide');
    subscribeLinksContainer.classList.add('show');

    // Scroll to the subscribe part
    subscribeLinksContainer.scrollIntoView({ behavior: 'smooth' });
}

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
    
    // 加载 configEditor 和 configType
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
localStorage.removeItem('configEditor');  // 添加清除 configEditor
localStorage.removeItem('configType');    // 添加清除 configType

    document.getElementById('inputTextarea').value = '';
    document.getElementById('advancedToggle').checked = false;
    document.getElementById('advancedOptions').classList.remove('show');
    document.getElementById('configEditor').value = '';
    document.getElementById('configType').value = 'singbox';  // 重置为默认值
    
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

const customRuleFunctions = `
let customRuleCount = 0;

function addCustomRule() {
const customRulesDiv = document.getElementById('customRules');
const newRuleDiv = document.createElement('div');
newRuleDiv.className = 'custom-rule mb-3 p-3 border rounded';
newRuleDiv.dataset.ruleId = customRuleCount++;
newRuleDiv.innerHTML = \`
<div class="mb-2">
<label class="form-label">规则名称*</label>
<input type="text" class="form-control mb-2" name="customRuleName[]" placeholder="规则名称" required>
</div>
<div class="mb-2">
<label class="form-label">Geo-Site 规则集</label>
<span class="tooltip-icon">
<i class="fas fa-question-circle"></i>
<span class="tooltip-content">
SingBox 中的站点规则来自 https://github.com/lyc8503/sing-box-rules，这意味着您的自定义规则必须在存储库中
</span>
</span>
<input type="text" class="form-control" name="customRuleSite[]" placeholder="e.g., google,anthropic">
</div>
<div class="mb-2">
<label class="form-label">Geo-IP 规则集</label>
<span class="tooltip-icon">
<i class="fas fa-question-circle"></i>
<span class="tooltip-content">
SingBox 中的 IP 规则来自 https://github.com/lyc8503/sing-box-rules，这意味着您的自定义规则必须在存储库中
</span>
</span>
<input type="text" class="form-control" name="customRuleIP[]" placeholder="e.g., private,cn">
</div>
<div class="mb-2">
<label class="form-label">域名后缀</label>
<input type="text" class="form-control mb-2" name="customRuleDomainSuffix[]" placeholder="域名后缀（逗号分隔）">
</div>
<div class="mb-2">
<label class="form-label">域名关键字</label>
<input type="text" class="form-control mb-2" name="customRuleDomainKeyword[]" placeholder="域名关键字（逗号分隔）">
</div>
<div class="mb-2">
<label class="form-label">IP段</label>
<input type="text" class="form-control mb-2" name="customRuleIPCIDR[]" placeholder="IP段（逗号分隔）">
</div>
<button type="button" class="btn btn-danger btn-sm" onclick="removeCustomRule(this)">删除</button>
\`;
customRulesDiv.appendChild(newRuleDiv);
}

function removeCustomRule(button) {
const ruleDiv = button.closest('.custom-rule');
if (ruleDiv) {
ruleDiv.classList.add('removing');
ruleDiv.addEventListener('animationend', () => {
ruleDiv.remove();
customRuleCount--;
}, { once: true });
}
}
`;

const generateQRCodeFunction = () => `
function generateQRCode(id) {
const input = document.getElementById(id);
const text = input.value;
if (!text) {
alert('未提供链接！');
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
          <p>扫描二维码</p>
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
      alert('尝试使用短链接！');
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
      alert('配置保存成功！');
    })
    .catch(error => {
      alert('异常: ' + error.message);
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
