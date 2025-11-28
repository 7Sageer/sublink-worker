export const generateStyles = () => `
  :root {
    --bg-color: #f8f9fa;
    --text-color: #212529;
    --card-bg: #ffffff;
    --card-header-bg: transparent;
    --primary-color: #0d6efd;
    --primary-hover: #0b5ed7;
    --input-bg: #ffffff;
    --input-border: #dee2e6;
    --input-focus-border: #86b7fe;
    --input-focus-shadow: rgba(13, 110, 253, 0.25);
    --input-text: #212529;
    --placeholder-color: #6c757d;
    --section-border: #e9ecef;
    --section-bg: #f8f9fa;
    --select-bg: #ffffff;
    --select-text: #212529;
    --select-border: #dee2e6;
    --dropdown-bg: #ffffff;
    --dropdown-text: #212529;
    --dropdown-hover-bg: #e9ecef;
    --dropdown-hover-text: #1e2125;
    --switch-bg: #e9ecef;
    --switch-checked-bg: #0d6efd;
    --transition-speed: 0.2s;
    --transition-timing: ease-in-out;
    --muted-color: #6c757d;
    --shadow-sm: 0 .125rem .25rem rgba(0,0,0,.075);
    --shadow-lg: 0 1rem 3rem rgba(0,0,0,.175);

    /* Typography Scale - 统一字号系统 */
    --font-size-base: 1rem;           /* 16px - 基础字号 */
    --font-size-sm: 0.875rem;         /* 14px - 小号文本、帮助文本、tooltip */
    --font-size-xs: 0.75rem;          /* 12px - 极小文本 */
    --font-size-lg: 1.125rem;         /* 18px - 大号文本 */
    --font-size-xl: 1.25rem;          /* 20px - 标题 */
  }

  [data-theme="dark"] {
    --bg-color: #121212;
    --text-color: #e0e0e0;
    --card-bg: #1e1e1e;
    --card-header-bg: transparent;
    --primary-color: #375a7f;
    --primary-hover: #2f4d6f;
    --input-bg: #2c2c2c;
    --input-border: #444;
    --input-focus-border: #5c7cfa;
    --input-focus-shadow: rgba(92, 124, 250, 0.25);
    --input-text: #e0e0e0;
    --placeholder-color: #adb5bd;
    --section-border: #2c2c2c;
    --section-bg: #252525;
    --select-bg: #2c2c2c;
    --select-text: #e0e0e0;
    --select-border: #444;
    --dropdown-bg: #2c2c2c;
    --dropdown-text: #e0e0e0;
    --dropdown-hover-bg: #3c3c3c;
    --dropdown-hover-text: #ffffff;
    --switch-bg: #444;
    --switch-checked-bg: #375a7f;
    --muted-color: #a0a0a0;
    --shadow-sm: 0 .125rem .25rem rgba(0,0,0,.3);
    --shadow-lg: 0 1rem 3rem rgba(0,0,0,.5);
  }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: var(--font-size-base); /* 使用统一的基础字号 */
    line-height: 1.6;
    transition: background-color 0.3s var(--transition-timing), color 0.3s var(--transition-timing);
    padding-top: 80px; /* Space for fixed navbar */
  }

  /* Navbar */
  .navbar {
    background-color: var(--card-bg);
    border-bottom: 1px solid var(--section-border);
    transition: background-color 0.3s var(--transition-timing), border-color 0.3s var(--transition-timing);
  }

  .navbar-brand {
    color: var(--text-color) !important;
  }

  .nav-link {
    color: var(--text-color) !important;
    transition: color 0.2s ease;
  }

  .nav-link:hover {
    color: var(--primary-color) !important;
  }

  /* Card */
  .card {
    background-color: var(--card-bg);
    border: 1px solid var(--section-border); /* Subtle border for definition */
    border-radius: 1.25rem; /* Larger radius */
    box-shadow: var(--shadow-lg);
    transition: background-color 0.3s var(--transition-timing), box-shadow 0.3s var(--transition-timing);
  }

  .card-header {
    background: var(--card-header-bg);
    color: var(--text-color);
    border-bottom: none;
  }

  .card-body {
    color: var(--text-color);
  }

  .form-section {
    padding: 1.25rem;
    margin-bottom: 1.25rem;
    border: 1px solid var(--section-border);
    border-radius: 10px;
    background: transparent; /* Unified background */
  }

  /* Ensure form button containers have proper spacing */
  .card-body .d-flex {
    margin-left: 0;
    margin-right: 0;
  }

  /* Target the convert/clear button container specifically */
  /* Ensure consistent spacing with other form elements */
  .card-body > form > .d-flex.gap-2.mt-4 {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .button-container {
    margin-left: 1.5rem !important;
    margin-right: 1.5rem !important;
    padding: 0;
    border: none;
    background: none;
  }
    
  .form-section-title {
    font-size: var(--font-size-xl); /* 统一标题字号 */
    font-weight: 700; /* Bolder */
    margin-bottom: 1rem;
    color: var(--text-color);
    letter-spacing: -0.02em;
  }

  .input-group {
    margin-bottom: 0.75rem;
  }

  .form-control, .form-select {
    padding: 0.75rem 1rem;
    font-size: var(--font-size-base); /* 统一表单控件字号 */
    border-radius: 0.75rem;
    border: 1px solid var(--input-border);
    transition: all 0.2s ease-in-out;
  }

  .form-control:focus, .form-select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--input-focus-shadow);
  }

  .btn {
    padding: 0.75rem 1.5rem; /* Larger buttons */
    font-size: var(--font-size-base); /* 统一按钮字号 */
    font-weight: 600;
    letter-spacing: 0.01em;
    transition: all 0.2s ease-in-out;
    border-radius: 0.75rem;
  }

  .btn-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
  }

  .btn-primary:hover {
    background-color: var(--primary-hover);
    border-color: var(--primary-hover);
  }

  .hover-lift {
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }

  .input-group-text, .form-control {
    background-color: var(--input-bg);
    border-color: var(--input-border);
    color: var(--input-text);
  }

  .form-control:focus {
    background-color: var(--input-bg);
    color: var(--input-text);
    border-color: var(--input-focus-border);
    box-shadow: 0 0 0 0.25rem var(--input-focus-shadow);
  }

  .link-card {
    background-color: var(--card-bg);
    border: 1px solid var(--section-border);
    border-radius: 1rem;
    padding: 1.25rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .link-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .link-card .form-label {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-color);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .link-card .input-group {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .link-card .form-control {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    border-right: none;
    border-radius: 0.5rem 0 0 0.5rem;
    min-width: 0;
    flex: 1 1 auto;
  }

  .link-card .btn {
    padding: 0.75rem 1rem;
    border-left: 1px solid var(--input-border);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .link-card .btn:last-child {
    border-radius: 0 0.5rem 0.5rem 0;
  }

  .link-card .btn:hover {
    transform: scale(1.05);
  }

  .link-card .btn-outline-primary:hover {
    background-color: var(--primary-color);
    color: white;
  }

  .link-card .btn-outline-secondary:hover {
    background-color: var(--text-color);
    color: var(--card-bg);
  }

  /* Responsive adjustments for link cards */
  @media (max-width: 768px) {
    .link-card {
      padding: 1.25rem;
    }

    .link-card .form-label {
      font-size: 0.85rem;
      margin-bottom: 0.75rem;
    }

    .link-card .input-group {
      flex-wrap: nowrap;
    }

    .link-card .form-control {
      font-size: 0.85rem;
      padding: 0.6rem 0.75rem;
      min-width: 0;
    }

    .link-card .btn {
      padding: 0.6rem 0.85rem;
      font-size: 0.9rem;
    }

    /* Stack buttons vertically on very small screens if needed */
    @media (max-width: 480px) {
      .link-card .input-group {
        flex-wrap: wrap;
      }

      .link-card .form-control {
        flex: 1 1 100%;
        border-radius: 0.5rem 0.5rem 0 0;
        border-right: 1px solid var(--input-border);
      }

      .link-card .btn {
        flex: 1;
        border-radius: 0;
      }

      .link-card .btn:last-child {
        border-radius: 0 0 0.5rem 0.5rem;
      }
    }
  }

  /* Subscribe Section Styling */
  .subscribe-section {
    padding: 1.5rem 0;
  }

  .subscribe-section h4 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: var(--text-color);
    position: relative;
    padding-bottom: 1rem;
  }

  .subscribe-section h4::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), transparent);
    border-radius: 2px;
  }

  .subscribe-section .row {
    margin-bottom: 0;
  }

  .subscribe-section .col-12,
  .subscribe-section .col-md-6 {
    margin-bottom: 1.5rem;
  }

  .subscribe-section .justify-content-center {
    margin-top: 2rem;
  }

  /* Custom Path Section Styling */
  .subscribe-section .mb-4 {
    background-color: var(--section-bg);
    border: 1px solid var(--section-border);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    margin-top: 2.5rem;
    margin-bottom: 2rem;
  }

  .subscribe-section .mb-4 .form-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 1rem;
  }

  .subscribe-section .mb-4 .input-group {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-radius: 0.5rem;
    overflow: visible;
  }

  .subscribe-section .mb-4 .input-group-text {
    background-color: var(--input-bg);
    border-right: none;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    color: var(--muted-color);
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .subscribe-section .mb-4 .form-control,
  .subscribe-section .mb-4 .form-select {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  /* Shorten Button Styling */
  .subscribe-section .btn-primary {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 0.75rem;
    box-shadow: 0 4px 8px rgba(13, 110, 253, 0.2);
    transition: all 0.3s ease;
  }

  .subscribe-section .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(13, 110, 253, 0.3);
  }

  @media (max-width: 768px) {
    .subscribe-section h4 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .subscribe-section .mb-4 {
      padding: 1.25rem;
    }

    .subscribe-section .btn-primary {
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
    }
  }

  /* Dark mode specific adjustments for subscribe section */
  [data-theme="dark"] .link-card {
    background-color: var(--card-bg);
    border-color: var(--section-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  [data-theme="dark"] .link-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  [data-theme="dark"] .subscribe-section .mb-4 {
    background-color: var(--section-bg);
    border-color: var(--section-border);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  [data-theme="dark"] .subscribe-section .btn-primary {
    box-shadow: 0 4px 8px rgba(55, 90, 127, 0.4);
  }

  [data-theme="dark"] .subscribe-section .btn-primary:hover {
    box-shadow: 0 6px 12px rgba(55, 90, 127, 0.6);
  }

  .fade-in-section {
    animation: fadeIn 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  h2, h4 {
    color: var(--text-color);
    font-weight: 600;
  }

  h5 {
    color: var(--text-color);
    font-weight: 500;
  }

  .form-label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-color);
    font-size: var(--font-size-sm); /* 统一表单标签字号 */
  }

  /* Make muted helper text readable, especially in dark mode */
  .text-muted { color: var(--muted-color) !important; }
  [data-theme="dark"] .text-muted { color: var(--muted-color) !important; opacity: 0.95; }

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
    color: var(--text-color);
    border-color: var(--input-border);
    background-color: var(--card-bg);
    transition: all 0.3s var(--transition-timing);
  }

  #darkModeToggle:hover {
    background-color: var(--dropdown-hover-bg);
    border-color: var(--text-color);
    color: var(--text-color);
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
    font-size: var(--font-size-sm); /* 统一tooltip图标字号 */
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
    position: fixed;
    background-color: var(--card-bg);
    color: var(--text-color);
    border: 1px solid var(--input-border);
    border-radius: 6px;
    padding: 10px;
    z-index: 1000;
    width: 220px; /* 增加宽度以适应更多内容 */
    max-width: 90vw;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: opacity 0.3s, visibility 0.3s;
    font-size: var(--font-size-sm); /* 统一tooltip内容字号 */
    line-height: 1.5; /* 改善可读性 */
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
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--input-focus-shadow);
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
    max-height: none;
    opacity: 1;
    transform: translateY(0);
    overflow: visible;
  }

  /* Custom Rules Section */
  .custom-rules-section {
    margin-bottom: 1.5rem;
  }

  .custom-rules-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--section-border);
  }

  .custom-rules-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
    margin-right: 0.5rem;
  }

  /* Custom Rules Container Styling */
  .custom-rules-container {
    border: 1px solid var(--input-border);
    border-radius: 10px;
    background-color: transparent; /* Unified background */
    overflow: hidden;
  }

  #customRules, #customRulesJSON {
    max-height: 600px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1rem;
    background-color: var(--input-bg);
  }

  #customRules:empty, #customRulesJSON:empty {
    padding: 0;
  }

  /* Custom Rules Section Header */
  .custom-rules-section-header {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--section-border);
  }

  .custom-rules-section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
    margin-right: 0.75rem;
  }

  /* Custom Rules Tabs */
  .custom-rules-tabs {
    display: flex;
    border-bottom: 2px solid var(--input-border);
    background-color: transparent; /* Unified background */
  }

  .custom-rules-tab {
    flex: 1;
    padding: 0.875rem 1rem;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;
    color: var(--text-color);
    transition: all 0.3s var(--transition-timing);
    border-bottom: 3px solid transparent;
    font-size: var(--font-size-sm); /* 统一tab字号 */
  }

  .custom-rules-tab:hover {
    background-color: var(--dropdown-hover-bg);
    color: var(--dropdown-hover-text);
  }

  .custom-rules-tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    background-color: var(--dropdown-hover-bg);
    font-weight: 600;
  }

  /* Dark mode specific adjustments for custom rules tabs */
  [data-theme="dark"] .custom-rules-tab {
    color: var(--text-color);
  }

  [data-theme="dark"] .custom-rules-tab:hover {
    background-color: var(--dropdown-hover-bg);
    color: var(--dropdown-hover-text);
  }

  [data-theme="dark"] .custom-rules-tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    background-color: var(--dropdown-hover-bg);
  }

  .custom-rules-content {
    min-height: 200px;
  }

  .custom-rules-view {
    display: none;
  }

  .custom-rules-view.active {
    display: block;
  }

  /* Conversion Controls */
  .conversion-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.875rem;
    background-color: var(--section-bg);
    border-radius: 8px;
    border: 1px solid var(--section-border);
  }

  .conversion-controls .btn {
    font-size: var(--font-size-sm); /* 统一控制按钮字号 */
    padding: 0.5rem 0.875rem;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    transition: all 0.3s var(--transition-timing);
  }

  .conversion-controls .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .conversion-controls .btn-outline-primary {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background-color: transparent;
  }

  .conversion-controls .btn-outline-primary:hover {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }

  .conversion-controls .btn-outline-secondary {
    border-color: var(--input-border);
    color: var(--text-color);
    background-color: transparent;
  }

  .conversion-controls .btn-outline-secondary:hover {
    background-color: var(--dropdown-hover-bg);
    border-color: var(--text-color);
    color: var(--text-color);
  }

  .conversion-controls .btn-outline-info {
    border-color: #17a2b8;
    color: #17a2b8;
    background-color: transparent;
  }

  .conversion-controls .btn-outline-info:hover {
    background-color: #17a2b8;
    border-color: #17a2b8;
    color: white;
  }

  .conversion-controls .btn-outline-danger {
    border-color: #dc3545;
    color: #dc3545;
    background-color: transparent;
  }

  .conversion-controls .btn-outline-danger:hover {
    background-color: #dc3545;
    border-color: #dc3545;
    color: white;
  }

  /* Dark mode specific button adjustments */
  [data-theme="dark"] .conversion-controls .btn-outline-primary {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  [data-theme="dark"] .conversion-controls .btn-outline-primary:hover {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
  }

  [data-theme="dark"] .conversion-controls .btn-outline-secondary {
    border-color: var(--input-border);
    color: var(--text-color);
  }

  [data-theme="dark"] .conversion-controls .btn-outline-secondary:hover {
    background-color: var(--dropdown-hover-bg);
    border-color: var(--text-color);
    color: var(--text-color);
  }

  [data-theme="dark"] .conversion-controls .btn-outline-info {
    border-color: #20c997;
    color: #20c997;
  }

  [data-theme="dark"] .conversion-controls .btn-outline-info:hover {
    background-color: #20c997;
    border-color: #20c997;
    color: white;
  }

  [data-theme="dark"] .conversion-controls .btn-outline-danger {
    border-color: #ff6b6b;
    color: #ff6b6b;
  }

  [data-theme="dark"] .conversion-controls .btn-outline-danger:hover {
    background-color: #ff6b6b;
    border-color: #ff6b6b;
    color: white;
  }

  /* Empty State Messages */
  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--placeholder-color);
    background-color: var(--section-bg);
    border-radius: 8px;
    margin: 1rem;
  }

  .empty-state i {
    color: var(--placeholder-color);
    margin-bottom: 0.75rem;
  }

  .empty-state p {
    margin: 0;
    font-size: var(--font-size-sm); /* 统一空状态文本字号 */
  }

  /* JSON Validation States */
  .json-valid {
    border-color: #28a745 !important;
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
  }

  .json-invalid {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
  }

  .json-validation-message {
    font-size: var(--font-size-sm); /* 统一验证消息字号 */
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s var(--transition-timing);
  }

  .json-validation-message.valid {
    color: #155724;
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
  }

  .json-validation-message.invalid {
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
  }

  /* Dark mode support for validation messages */
  [data-theme="dark"] .json-validation-message.valid {
    color: #75b798;
    background-color: rgba(40, 167, 69, 0.2);
    border: 1px solid rgba(40, 167, 69, 0.3);
  }

  [data-theme="dark"] .json-validation-message.invalid {
    color: #f1aeb5;
    background-color: rgba(220, 53, 69, 0.2);
    border: 1px solid rgba(220, 53, 69, 0.3);
  }

  .json-textarea-container {
    position: relative;
  }

  /* Custom Rule Cards */
  .custom-rule, .custom-rule-json {
    margin-bottom: 1rem;
    border: 1px solid var(--input-border);
    border-radius: 8px;
    background-color: var(--card-bg);
    transition: all 0.3s var(--transition-timing);
    padding: 1rem;
  }

  .custom-rule:hover, .custom-rule-json:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px var(--input-focus-shadow);
  }

  .custom-rule h6, .custom-rule-json h6 {
    color: var(--text-color);
    font-weight: 600;
    margin: 0;
  }

  .custom-rule .form-label, .custom-rule-json .form-label {
    color: var(--text-color);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .custom-rule .form-control, .custom-rule-json .form-control {
    background-color: var(--input-bg);
    border-color: var(--input-border);
    color: var(--text-color);
  }

  .custom-rule .form-control:focus, .custom-rule-json .form-control:focus {
    background-color: var(--input-bg);
    border-color: var(--primary-color);
    color: var(--text-color);
    box-shadow: 0 0 0 0.2rem var(--input-focus-shadow);
  }

  .custom-rule .form-control::placeholder, .custom-rule-json .form-control::placeholder {
    color: var(--placeholder-color);
  }

  /* Dark mode specific adjustments for custom rule cards */
  [data-theme="dark"] .custom-rule:hover,
  [data-theme="dark"] .custom-rule-json:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px var(--input-focus-shadow);
  }

  [data-theme="dark"] .custom-rule .form-control:focus,
  [data-theme="dark"] .custom-rule-json .form-control:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem var(--input-focus-shadow);
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
    font-size: var(--font-size-base); /* 统一QR卡片文本字号 */
  }

  .base-url-label {
    background-color: var(--input-bg);
    color: var(--input-text);
    border: 1px solid var(--input-border);
    border-radius: 0.25rem;
    padding: 0.375rem 0.75rem;
    font-size: var(--font-size-base); /* 统一标签字号 */
    line-height: 1.5;
  }

  /* Toast Notifications */
  .toast-container {
    z-index: 9999 !important;
  }

  .toast {
    font-size: var(--font-size-sm);
    border-radius: 0.5rem;
    box-shadow: var(--shadow-lg);
  }

  .toast-header {
    background-color: transparent;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    font-weight: 600;
  }

  .toast-body {
    padding: 0.75rem;
  }

  /* Toast variants - 暗色模式兼容 */
  [data-theme="dark"] .toast {
    background-color: var(--card-bg);
    color: var(--text-color);
    border: 1px solid var(--input-border);
  }

  [data-theme="dark"] .toast-header {
    background-color: transparent;
    border-bottom: 1px solid var(--input-border);
    color: var(--text-color);
  }

  [data-theme="dark"] .toast .btn-close {
    filter: invert(1);
  }


  #subscribeLinksContainer {
    max-height: 0;
    opacity: 0;
    transform: translateY(20px);
    transition: max-height 0.5s var(--transition-timing),
                opacity 0.3s var(--transition-timing),
                transform 0.3s var(--transition-timing);
    padding: 1.5rem 1.5rem;
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

  #subscribeLinksContainer .mb-4 {
    margin-bottom: 1.5rem !important;
  }

  #subscribeLinksContainer .mt-4 {
    margin-top: 1.5rem !important;
  }

  #subscribeLinksContainer .mt-3 {
    margin-top: 1.25rem !important;
  }

  #subscribeLinksContainer .mb-5 {
    margin-bottom: 1.5rem !important;
  }

  #subscribeLinksContainer .mt-5 {
    margin-top: 1.5rem !important;
  }

  /* Add consistent spacing between link sections */
  #subscribeLinksContainer .input-group {
    margin-bottom: 0.5rem;
    margin-left: 0;
    margin-right: 0;
  }

  #subscribeLinksContainer .form-label {
    margin-bottom: 0.75rem;
    font-weight: 500;
    color: var(--text-color);
  }

  /* Ensure proper spacing for all form elements within the container */
  #subscribeLinksContainer .mb-4 {
    padding-left: 0;
    padding-right: 0;
  }

  /* Ensure all button containers within cards have proper spacing */
  /* Fix button container spacing without interfering with gap-2 */
  .card-body .d-grid {
    margin-left: 1.5rem !important;
    margin-right: 1.5rem !important;
  }

  /* Form sections should not add extra padding to button containers */
  .form-section .d-flex.gap-2 {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  /* Add subtle visual separation between sections */
  #subscribeLinksContainer > div:not(:last-child) {
    border-bottom: 1px solid var(--input-border);
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }

  /* Remove border from the button container and ensure proper spacing */
  #subscribeLinksContainer .d-grid {
    border-bottom: none !important;
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  /* Responsive spacing adjustments */
  @media (max-width: 768px) {
    #subscribeLinksContainer {
      padding: 1rem 1rem !important;
    }

    #subscribeLinksContainer .mb-4 {
      margin-bottom: 1rem !important;
    }

    #subscribeLinksContainer .mt-4 {
      margin-top: 1rem !important;
    }

    #subscribeLinksContainer .mt-3 {
      margin-top: 0.75rem !important;
    }

    #subscribeLinksContainer .mb-5 {
      margin-bottom: 1rem !important;
    }

    #subscribeLinksContainer .mt-5 {
      margin-top: 1rem !important;
    }

    /* Adjust button container spacing for mobile */
    .card-body .d-grid {
      margin-left: 1rem !important;
      margin-right: 1rem !important;
    }

    /* Form sections should not add extra spacing on mobile */
    .form-section .d-flex.gap-2 {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    /* Add horizontal margin to main form button containers on mobile */
    .card-body > form > .d-flex.gap-2.mt-4,
    .card-body .d-flex.gap-2.mt-4 {
      margin-left: 1rem !important;
      margin-right: 1rem !important;
    }
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

  /* 高级选项展开/收起动画 - Updated to remove height constraints */
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
    max-height: none;
    opacity: 1;
    transform: translateY(0);
    overflow: visible;
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
