export const generateStyles = () => `
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
    position: fixed;
    background-color: var(--card-bg);
    color: var(--text-color);
    border: 1px solid var(--input-border);
    border-radius: 6px;
    padding: 10px;
    z-index: 1000;
    width: 180px;
    max-width: 90vw;
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
    background-color: var(--card-bg);
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
    background-color: var(--card-bg);
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
    font-size: 0.95rem;
  }

  .custom-rules-tab:hover {
    background-color: var(--dropdown-hover-bg);
    color: var(--dropdown-hover-text);
  }

  .custom-rules-tab.active {
    color: #6a11cb;
    border-bottom-color: #6a11cb;
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
    color: #8a4fff;
    border-bottom-color: #8a4fff;
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
    font-size: 0.875rem;
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
    border-color: #6a11cb;
    color: #6a11cb;
    background-color: transparent;
  }

  .conversion-controls .btn-outline-primary:hover {
    background-color: #6a11cb;
    border-color: #6a11cb;
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
    border-color: #8a4fff;
    color: #8a4fff;
  }

  [data-theme="dark"] .conversion-controls .btn-outline-primary:hover {
    background-color: #8a4fff;
    border-color: #8a4fff;
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
    font-size: 0.95rem;
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
    font-size: 0.875rem;
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
    border-color: #6a11cb;
    box-shadow: 0 2px 8px rgba(106, 17, 203, 0.1);
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
    border-color: #6a11cb;
    color: var(--text-color);
    box-shadow: 0 0 0 0.2rem rgba(106, 17, 203, 0.25);
  }

  .custom-rule .form-control::placeholder, .custom-rule-json .form-control::placeholder {
    color: var(--placeholder-color);
  }

  /* Dark mode specific adjustments for custom rule cards */
  [data-theme="dark"] .custom-rule:hover,
  [data-theme="dark"] .custom-rule-json:hover {
    border-color: #8a4fff;
    box-shadow: 0 2px 8px rgba(138, 79, 255, 0.2);
  }

  [data-theme="dark"] .custom-rule .form-control:focus,
  [data-theme="dark"] .custom-rule-json .form-control:focus {
    border-color: #8a4fff;
    box-shadow: 0 0 0 0.2rem rgba(138, 79, 255, 0.25);
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