import { UNIFIED_RULES, PREDEFINED_RULE_SETS } from './config.js';

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
    --placeholder-color: #6c757d;
    --section-border: rgba(0, 0, 0, 0.1);
    --section-bg: rgba(0, 0, 0, 0.02);
    --select-bg: #ffffff;
    --select-text: #495057;
    --select-border: #ced4da;
    --dropdown-bg: #ffffff;
    --dropdown-text: #495057;
    --dropdown-hover-bg: #f8f9fa;
    --dropdown-hover-text: #495057;
    --switch-bg: #e9ecef;
    --switch-checked-bg: #6a11cb;
    --transition-speed: 0.3s;
    --transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
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
    --placeholder-color: #adb5bd;
    --section-border: rgba(255, 255, 255, 0.1);
    --section-bg: rgba(255, 255, 255, 0.02);
    --select-bg: #3c3c3c;
    --select-text: #e0e0e0;
    --select-border: #555555;
    --dropdown-bg: #2c2c2c;
    --dropdown-text: #e0e0e0;
    --dropdown-hover-bg: #3c3c3c;
    --dropdown-hover-text: #e0e0e0;
    --switch-bg: #555555;
    --switch-checked-bg: #4a0e8f;
  }

  .container { max-width: 800px; }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    transition: background-color 0.3s var(--transition-timing), color 0.3s var(--transition-timing);
  }

  .card {
    background-color: var(--card-bg);
    border: none;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .card-header {
    background: var(--card-header-bg);
    color: white;
    border-radius: 15px 15px 0 0;
    padding: 2.5rem 2rem;
    border-bottom: 1px solid var(--section-border);
  }

  .card-body {
    padding: 2rem;
  }

  .form-section {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid var(--section-border);
    border-radius: 10px;
    background: var(--section-bg);
  }

  .form-section-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .form-control, .form-select {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .form-control:focus, .form-select:focus {
    border-color: #6a11cb;
    box-shadow: 0 0 0 0.2rem rgba(106, 17, 203, 0.25);
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: var(--btn-primary-bg);
    border: none;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(106, 17, 203, 0.2);
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

  h5 {
    color: var(--text-color);
    font-weight: 500;
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
  
  .tooltip-icon {
    cursor: pointer;
    margin-left: 5px;
    color: var(--text-color);
    position: relative;
    display: inline-block;
    vertical-align: super;
    font-size: 1em;
  }

  .question-mark {
    display: inline-block;
    width: 16px;
    height: 16px;
    line-height: 16px;
    text-align: center;
    border-radius: 50%;
    background-color: var(--text-color);
    color: var(--card-bg);
  }

  .tooltip-content {
    visibility: hidden;
    opacity: 0;
    background-color: var(--card-bg);
    position: fixed; // 改为固定定位
    background-color: var(--card-bg);
    color: var(--text-color);
    border: 1px solid var(--input-border);
    border-radius: 6px;
    padding: 10px;
    z-index: 1000; // 提高z-index值
    width: 300px;
    max-width: 90vw; // 限制最大宽度
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: opacity 0.3s, visibility 0.3s;
  }

  .tooltip-icon:hover .tooltip-content {
    visibility: visible;
    opacity: 1;
  }

  @media (max-width: 768px) {
    .tooltip-content {
      width: 250px;
      left: auto;
      right: 0;
      transform: none;
    }
  }

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

  .form-select {
    background-color: var(--select-bg);
    color: var(--select-text);
    border-color: var(--select-border);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
    
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;

    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23495057' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1em;
    padding-right: 2.5em;
  }

  [data-theme="dark"] .form-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e0e0e0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  }

  .form-select:focus {
    background-color: var(--select-bg);
    color: var(--select-text);
    border-color: var(--checkbox-checked-border);
    box-shadow: 0 0 0 0.2rem rgba(106, 17, 203, 0.25);
  }

  .form-control::placeholder {
    color: var(--placeholder-color);
    opacity: 1;
  }

  .form-control::-webkit-input-placeholder {
    color: var(--placeholder-color);
    opacity: 1;
  }

  .form-control::-moz-placeholder {
    color: var(--placeholder-color);
    opacity: 1;
  }

  .form-control:-ms-input-placeholder {
    color: var(--placeholder-color);
    opacity: 1;
  }

  .form-control::-ms-input-placeholder {
    color: var(--placeholder-color);
    opacity: 1;
  }

  #advancedOptions {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transform: translateY(-20px);
    transition: max-height 0.5s var(--transition-timing),
                opacity 0.3s var(--transition-timing),
                transform 0.3s var(--transition-timing);
  }

  #advancedOptions.show {
    max-height: 2000px;
    opacity: 1;
    transform: translateY(0);
  }

  .header-container {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
  }
  .header-title {
      margin: 0;
      margin-right: 10px;
  }

  .qr-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s var(--transition-timing),
                visibility 0.3s var(--transition-timing);
    z-index: 1000;
  }

  .qr-modal.show {
    opacity: 1;
    visibility: visible;
  }

  .qr-card {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    transform: scale(0.9) translateY(20px);
    transition: transform 0.3s var(--transition-timing);
  }

  .qr-modal.show .qr-card {
    transform: scale(1) translateY(0);
  }

  .qr-card img {
    max-width: 100%;
    height: auto;
  }

  .qr-card p {
    margin-top: 10px;
    color: #333;
    font-size: 16px;
  }

  .base-url-label {
    background-color: var(--input-bg);
    color: var(--input-text);
    border: 1px solid var(--input-border);
    border-radius: 0.25rem;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
  }

  #subscribeLinksContainer {
    max-height: 0;
    opacity: 0;
    transform: translateY(20px);
    transition: max-height 0.5s var(--transition-timing),
                opacity 0.3s var(--transition-timing),
                transform 0.3s var(--transition-timing);
  }

  #subscribeLinksContainer.show {
    max-height: 1000px;
    opacity: 1;
    transform: translateY(0);
  }

  #subscribeLinksContainer.hide {
    max-height: 0;
    opacity: 0;
  }

  .form-select option {
    background-color: var(--dropdown-bg);
    color: var(--dropdown-text);
  }

  .form-select option:hover {
    background-color: var(--dropdown-hover-bg);
    color: var(--dropdown-hover-text);
  }

  .form-check-input {
    background-color: var(--switch-bg);
    border-color: var(--switch-border);
  }

  .form-check-input:checked {
    background-color: var(--switch-checked-bg);
    border-color: var(--switch-checked-bg);
  }

  .dropdown-menu {
    background-color: var(--dropdown-bg);
    border-color: var(--select-border);
  }

  .dropdown-item {
    color: var(--dropdown-text);
  }

  .dropdown-item:hover,
  .dropdown-item:focus {
    background-color: var(--dropdown-hover-bg);
    color: var(--dropdown-hover-text);
  }

  /* 通用过渡效果 */
  .card,
  .btn,
  .form-control,
  .form-select,
  .input-group,
  .tooltip-content,
  .github-link,
  .qr-modal,
  .qr-card {
    transition: all var(--transition-speed) var(--transition-timing);
  }

  /* 高级选项展开/收起动画 */
  #advancedOptions {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transform: translateY(-20px);
    transition: max-height 0.5s var(--transition-timing),
                opacity 0.3s var(--transition-timing),
                transform 0.3s var(--transition-timing);
  }

  #advancedOptions.show {
    max-height: 2000px;
    opacity: 1;
    transform: translateY(0);
  }

  /* 订阅链接容器动画 */
  #subscribeLinksContainer {
    max-height: 0;
    opacity: 0;
    transform: translateY(20px);
    transition: max-height 0.5s var(--transition-timing),
                opacity 0.3s var(--transition-timing),
                transform 0.3s var(--transition-timing);
  }

  #subscribeLinksContainer.show {
    max-height: 1000px;
    opacity: 1;
    transform: translateY(0);
  }

  /* 按钮悬停动画 */
  .btn {
    transform: translateY(0);
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  /* 复制按钮成功动画 */
  @keyframes successPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .btn-success {
    animation: successPulse 0.3s var(--transition-timing);
  }

  /* QR码模态框动画 */
  .qr-modal {
    opacity: 0;
    visibility: hidden;
    backdrop-filter: blur(5px);
    transition: opacity 0.3s var(--transition-timing),
                visibility 0.3s var(--transition-timing);
  }

  .qr-modal.show {
    opacity: 1;
    visibility: visible;
  }

  .qr-card {
    transform: scale(0.9) translateY(20px);
    transition: transform 0.3s var(--transition-timing);
  }

  .qr-modal.show .qr-card {
    transform: scale(1) translateY(0);
  }

  /* 自定义规则添加/删除动画 */
  .custom-rule {
    opacity: 0;
    transform: translateY(20px);
    animation: slideIn 0.3s var(--transition-timing) forwards;
  }

  .custom-rule.removing {
    animation: slideOut 0.3s var(--transition-timing) forwards;
  }

  @keyframes slideIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }

  /* 暗色模式切换动画 */
  body {
    transition: background-color 0.3s var(--transition-timing),
                color 0.3s var(--transition-timing);
  }

  /* 工具提示动画 */
  .tooltip-content {
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
    transition: opacity 0.3s var(--transition-timing),
                visibility 0.3s var(--transition-timing),
                transform 0.3s var(--transition-timing);
  }

  .tooltip-icon:hover .tooltip-content {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
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
    <div class="form-section">
      <div class="form-section-title">Share URLs</div>
      <textarea class="form-control" id="inputTextarea" name="input" required placeholder="vmess://abcd..." rows="3"></textarea>
    </div>

    <div class="form-check form-switch mb-3">
      <input class="form-check-input" type="checkbox" id="advancedToggle">
      <label class="form-check-label" for="advancedToggle">Advanced Options</label>
    </div>

    <div id="advancedOptions">
      <div class="form-section">
        ${generateRuleSetSelection()}
      </div>

      <div class="form-section">
        <div class="form-section-title d-flex align-items-center">
          Base Config Settings(Optional)
          <span class="tooltip-icon ms-2">
            <i class="fas fa-question-circle"></i>
            <span class="tooltip-content">
              This feature is experimental and may not work as expected. You can paste your own base config here. Go to <a href="https://github.com/7Sageer/sublink-worker/blob/main/docs/base-config.md" target="_blank">docs</a> for more information.
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
          <button type="button" class="btn btn-secondary" onclick="saveConfig()">Save Config</button>
          <button type="button" class="btn btn-outline-danger" onclick="clearConfig()">
            <i class="fas fa-trash-alt me-2"></i>Clear Config
          </button>
        </div>
      </div>
    </div>

    <div class="d-flex gap-2 mt-4">
      <button type="submit" class="btn btn-primary flex-grow-1">
        <i class="fas fa-sync-alt me-2"></i>Convert
      </button>
      <button type="button" class="btn btn-outline-secondary" id="clearFormBtn">
        <i class="fas fa-trash-alt me-2"></i>Clear
      </button>
    </div>
  </form>
`;

const generateSubscribeLinks = (xrayUrl, singboxUrl, clashUrl, baseUrl) => `
  <div class="mt-5">
    <h2 class="mb-4">Your subscribe links:</h2>
    ${generateLinkInput('Xray Link:', 'xrayLink', xrayUrl)}
    ${generateLinkInput('SingBox Link:', 'singboxLink', singboxUrl)}
    ${generateLinkInput('Clash Link:', 'clashLink', clashUrl)}
    <div class="mb-3">
      <label for="customShortCode" class="form-label">Custom Path (optional):</label>
      <div class="input-group flex-nowrap">
        <span class="input-group-text text-truncate" style="max-width: 400px;" title="${baseUrl}/s/">
          ${baseUrl}/s/
        </span>
        <input type="text" class="form-control" id="customShortCode" placeholder="e.g. my-custom-link">
        <select id="savedCustomPaths" class="form-select" style="max-width: 200px;">
          <option value="">Saved paths</option>
        </select>
        <button class="btn btn-outline-danger" type="button" onclick="deleteSelectedPath()">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
    <div class="d-grid">
      <button class="btn btn-primary btn-lg" type="button" onclick="shortenAllUrls()">
        <i class="fas fa-compress-alt me-2"></i>Shorten Links
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
    const shortenButton = document.querySelector('button[onclick="shortenAllUrls()"]');
    shortenButton.disabled = true;
    shortenButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Shortening...';

    try {
      const xrayLink = document.getElementById('xrayLink');
      const singboxLink = document.getElementById('singboxLink');
      const clashLink = document.getElementById('clashLink');
      const customShortCode = document.getElementById('customShortCode').value;

      const shortCode = await shortenUrl(singboxLink.value, customShortCode);

      xrayLink.value = window.location.origin + '/x/' + shortCode;
      singboxLink.value = window.location.origin + '/b/' + shortCode;
      clashLink.value = window.location.origin + '/c/' + shortCode;
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to shorten URLs. Please try again.');
    } finally {
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
  <div class="container">
    <div class="header-container">
      <h4 class="header-title">Rule Selection</h4>
      <span class="tooltip-icon">
        <i class="fas fa-question-circle"></i>
        <span class="tooltip-content">
          These rules determine how traffic is directed through different proxies or directly. If you're unsure, you can use a predefined rule set.
        </span>
      </span>
    </div>

    <div class="content-container mb-3">
      <select class="form-select" id="predefinedRules" onchange="applyPredefinedRules()">
        <option value="custom">Custom</option>
        <option value="minimal">Minimal</option>
        <option value="balanced">Balanced</option>
        <option value="comprehensive">Comprehensive</option>
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
      <h5>Custom Rules</h5>
      <div class="form-check form-switch mb-3">
        <input class="form-check-input" type="checkbox" id="crpinToggle">
        <label class="form-check-label" for="crpinToggle">Pin Custom Rules</label>
      </div>
      <div id="customRules">
      <!-- Custom rules will be dynamically added here -->
    </div>
    <button type="button" class="btn btn-secondary mt-2" onclick="addCustomRule()">Add Custom Rule</button>
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
        <label class="form-label">Outbound Name*</label>
        <input type="text" class="form-control mb-2" name="customRuleName[]" placeholder="Rule Name" required>
      </div>
      <div class="mb-2">
        <label class="form-label">Geo-Site Rule Sets</label>
        <span class="tooltip-icon">
          <i class="fas fa-question-circle"></i>
          <span class="tooltip-content">
            Site Rules in SingBox comes from https://github.com/lyc8503/sing-box-rules, that means your custom rules must be in the repos
          </span>
        </span>
        <input type="text" class="form-control" name="customRuleSite[]" placeholder="e.g., google,anthropic">
      </div>
      <div class="mb-2">
        <label class="form-label">Geo-IP Rule Sets</label>
        <span class="tooltip-icon">
          <i class="fas fa-question-circle"></i>
          <span class="tooltip-content">
            IP Rules in SingBox comes from https://github.com/lyc8503/sing-box-rules, that means your custom rules must be in the repos
          </span>
        </span>
        <input type="text" class="form-control" name="customRuleIP[]" placeholder="e.g., private,cn">
      </div>
      <div class="mb-2">
        <label class="form-label">Domain Suffix</label>
        <input type="text" class="form-control mb-2" name="customRuleDomainSuffix[]" placeholder="Domain Suffix (comma separated)">
      </div>
      <div class="mb-2">
        <label class="form-label">Domain Keyword</label>
        <input type="text" class="form-control mb-2" name="customRuleDomainKeyword[]" placeholder="Domain Keyword (comma separated)">
      </div>
      <div class="mb-2">
        <label class="form-label">IP CIDR</label>
        <input type="text" class="form-control mb-2" name="customRuleIPCIDR[]" placeholder="IP CIDR (comma separated)">
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeCustomRule(this)">Remove</button>
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
    
    // 保存到 localStorage
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
