import { parseSurgeConfigInput } from '../utils/surgeConfigParser.js';

export const formLogicFn = (t) => {
    window.formData = function () {
        return {
            input: '',
            showAdvanced: false,
            // Accordion states for each section (二级手风琴状态)
            accordionSections: {
                rules: true,        // 规则选择 - 默认展开
                customRules: false, // 自定义规则
                general: false,     // 通用设置
                baseConfig: false,  // 基础配置
                ua: false          // User Agent
            },
            selectedRules: [],
            selectedPredefinedRule: 'balanced',
            groupByCountry: false,
            enableClashUI: false,
            externalController: '',
            externalUiDownloadUrl: '',
            configType: 'singbox',
            configEditor: '',
            savingConfig: false,
            currentConfigId: '',
            saveConfigText: '',
            savingConfigText: '',
            configContentRequiredText: '',
            configSaveFailedText: '',
            configValidationState: '',
            configValidationMessage: '',
            customUA: '',
            loading: false,
            generatedLinks: null,
            shortenedLinks: null,
            shortening: false,
            customShortCode: '',
            // These will be populated from window.APP_TRANSLATIONS
            processingText: '',
            convertText: '',
            shortenLinksText: '',
            shorteningText: '',
            showFullLinksText: '',

            init() {
                // Load translations
                if (window.APP_TRANSLATIONS) {
                    this.processingText = window.APP_TRANSLATIONS.processing;
                    this.convertText = window.APP_TRANSLATIONS.convert;
                    this.shortenLinksText = window.APP_TRANSLATIONS.shortenLinks;
                    this.shorteningText = window.APP_TRANSLATIONS.shortening;
                    this.showFullLinksText = window.APP_TRANSLATIONS.showFullLinks;
                    this.saveConfigText = window.APP_TRANSLATIONS.saveConfig;
                    this.savingConfigText = window.APP_TRANSLATIONS.savingConfig;
                    this.configContentRequiredText = window.APP_TRANSLATIONS.configContentRequired;
                    this.configSaveFailedText = window.APP_TRANSLATIONS.configSaveFailed;
                }

                // Load saved data
                this.input = localStorage.getItem('inputTextarea') || '';
                this.showAdvanced = localStorage.getItem('advancedToggle') === 'true';
                this.groupByCountry = localStorage.getItem('groupByCountry') === 'true';
                this.enableClashUI = localStorage.getItem('enableClashUI') === 'true';
                this.externalController = localStorage.getItem('externalController') || '';
                this.externalUiDownloadUrl = localStorage.getItem('externalUiDownloadUrl') || '';
                this.customUA = localStorage.getItem('userAgent') || '';
                this.configEditor = localStorage.getItem('configEditor') || '';
                this.configType = localStorage.getItem('configType') || 'singbox';
                this.customShortCode = localStorage.getItem('customShortCode') || '';
                const initialUrlParams = new URLSearchParams(window.location.search);
                this.currentConfigId = initialUrlParams.get('configId') || '';

                // Load accordion states
                const savedAccordion = localStorage.getItem('accordionSections');
                if (savedAccordion) {
                    try {
                        this.accordionSections = JSON.parse(savedAccordion);
                    } catch (e) {
                        // If parsing fails, keep defaults
                    }
                }

                // Initialize rules
                this.applyPredefinedRule();

                // Watchers to save state
                this.$watch('input', val => localStorage.setItem('inputTextarea', val));
                this.$watch('showAdvanced', val => localStorage.setItem('advancedToggle', val));
                this.$watch('groupByCountry', val => localStorage.setItem('groupByCountry', val));
                this.$watch('enableClashUI', val => localStorage.setItem('enableClashUI', val));
                this.$watch('externalController', val => localStorage.setItem('externalController', val));
                this.$watch('externalUiDownloadUrl', val => localStorage.setItem('externalUiDownloadUrl', val));
                this.$watch('customUA', val => localStorage.setItem('userAgent', val));
                this.$watch('configEditor', val => {
                    localStorage.setItem('configEditor', val);
                    this.resetConfigValidation();
                });
                this.$watch('configType', val => {
                    localStorage.setItem('configType', val);
                    this.resetConfigValidation();
                });
                this.$watch('customShortCode', val => localStorage.setItem('customShortCode', val));
                this.$watch('accordionSections', val => localStorage.setItem('accordionSections', JSON.stringify(val)), { deep: true });
            },

            toggleAccordion(section) {
                this.accordionSections[section] = !this.accordionSections[section];
            },

            applyPredefinedRule() {
                if (this.selectedPredefinedRule === 'custom') return;

                // PREDEFINED_RULE_SETS will be injected globally
                const rules = window.PREDEFINED_RULE_SETS;
                if (rules && rules[this.selectedPredefinedRule]) {
                    this.selectedRules = rules[this.selectedPredefinedRule];
                }
            },

            resetConfigValidation() {
                this.configValidationState = '';
                this.configValidationMessage = '';
            },

            async saveBaseConfig() {
                const content = (this.configEditor || '').trim();
                if (!content) {
                    alert(this.configContentRequiredText || window.APP_TRANSLATIONS.configContentRequired);
                    return;
                }

                let payloadContent = this.configEditor;
                if (this.configType === 'surge') {
                    try {
                        const { configObject } = parseSurgeConfigInput(this.configEditor);
                        payloadContent = JSON.stringify(configObject);
                    } catch (parseError) {
                        const prefix = window.APP_TRANSLATIONS.configValidationError || 'Config validation error:';
                        alert(`${prefix} ${parseError?.message || ''}`.trim());
                        return;
                    }
                }

                this.savingConfig = true;
                try {
                    const response = await fetch('/config', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            type: this.configType,
                            content: payloadContent
                        })
                    });
                    const responseText = await response.text();
                    if (!response.ok) {
                        throw new Error(responseText || response.statusText || 'Request failed');
                    }
                    const configId = responseText.trim();
                    if (!configId) {
                        throw new Error('Missing config ID');
                    }
                    this.currentConfigId = configId;
                    this.updateConfigIdInUrl(configId);

                    const successMessage = window.APP_TRANSLATIONS.saveConfigSuccess || 'Configuration saved successfully!';
                    alert(`${successMessage}\nID: ${configId}`);
                } catch (error) {
                    console.error('Failed to save base config:', error);
                    const errorPrefix = this.configSaveFailedText || window.APP_TRANSLATIONS.configSaveFailed || 'Failed to save configuration';
                    alert(`${errorPrefix}: ${error?.message || 'Unknown error'}`);
                } finally {
                    this.savingConfig = false;
                }
            },

            validateBaseConfig() {
                const content = (this.configEditor || '').trim();
                if (!content) {
                    this.configValidationState = 'error';
                    this.configValidationMessage = this.configContentRequiredText || window.APP_TRANSLATIONS.configContentRequired;
                    return;
                }

                try {
                    if (this.configType === 'clash') {
                        if (!window.jsyaml || !window.jsyaml.load) {
                            throw new Error(window.APP_TRANSLATIONS.parserUnavailable || 'Parser unavailable. Please refresh and try again.');
                        }
                        window.jsyaml.load(content);
                        this.configValidationState = 'success';
                        this.configValidationMessage =
                            window.APP_TRANSLATIONS.validYamlConfig || 'YAML config is valid';
                    } else if (this.configType === 'surge') {
                        parseSurgeConfigInput(this.configEditor);
                        this.configValidationState = 'success';
                        this.configValidationMessage =
                            window.APP_TRANSLATIONS.validJsonConfig || 'JSON config is valid';
                    } else {
                        JSON.parse(content);
                        this.configValidationState = 'success';
                        this.configValidationMessage =
                            window.APP_TRANSLATIONS.validJsonConfig || 'JSON config is valid';
                    }
                } catch (error) {
                    this.configValidationState = 'error';
                    const prefix = window.APP_TRANSLATIONS.configValidationError || 'Config validation error: ';
                    this.configValidationMessage = `${prefix}${error?.message || ''}`;
                }
            },

            clearBaseConfig() {
                if (confirm(window.APP_TRANSLATIONS.confirmClearConfig)) {
                    this.configEditor = '';
                    localStorage.removeItem('configEditor');
                    this.currentConfigId = '';
                    this.updateConfigIdInUrl(null);
                }
            },

            clearAll() {
                if (confirm(window.APP_TRANSLATIONS.confirmClearAll)) {
                    this.input = '';
                    this.generatedLinks = null;
                    this.shortenedLinks = null;
                    this.customShortCode = '';
                    // Also clear from localStorage
                    localStorage.removeItem('customShortCode');
                }
            },

            updateConfigIdInUrl(configId) {
                const url = new URL(window.location.href);
                if (configId) {
                    url.searchParams.set('configId', configId);
                } else {
                    url.searchParams.delete('configId');
                }
                window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
            },

            async submitForm() {
                this.loading = true;
                this.shortenedLinks = null; // Reset shortened links when generating new links
                try {
                    // Get custom rules from the child component via the hidden input
                    const customRulesInput = document.querySelector('input[name="customRules"]');
                    const customRules = customRulesInput && customRulesInput.value ? JSON.parse(customRulesInput.value) : [];

                    // Construct URLs
                    const origin = window.location.origin;
                    const params = new URLSearchParams();
                    params.append('config', this.input);
                    params.append('ua', this.customUA);
                    params.append('selectedRules', JSON.stringify(this.selectedRules));
                    params.append('customRules', JSON.stringify(customRules));

                    if (this.groupByCountry) params.append('group_by_country', 'true');
                    if (this.enableClashUI) params.append('enable_clash_ui', 'true');
                    if (this.externalController) params.append('external_controller', this.externalController);
                    if (this.externalUiDownloadUrl) params.append('external_ui_download_url', this.externalUiDownloadUrl);

                    // Add configId if present in URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const configId = this.currentConfigId || urlParams.get('configId');
                    if (configId) {
                        params.append('configId', configId);
                    }

                    const queryString = params.toString();

                    this.generatedLinks = {
                        xray: origin + '/xray?' + queryString,
                        singbox: origin + '/singbox?' + queryString,
                        clash: origin + '/clash?' + queryString,
                        surge: origin + '/surge?' + queryString
                    };

                    // Scroll to results
                    setTimeout(() => {
                        const resultsDiv = document.querySelector('.mt-12');
                        if (resultsDiv) {
                            resultsDiv.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 100);

                } catch (error) {
                    console.error('Error generating links:', error);
                    alert(window.APP_TRANSLATIONS.errorGeneratingLinks);
                } finally {
                    this.loading = false;
                }
            },

            async shortenLinks() {
                // Check if links are already shortened
                if (this.shortenedLinks) {
                    alert(window.APP_TRANSLATIONS.alreadyShortened);
                    return;
                }

                if (!this.generatedLinks) {
                    return;
                }

                this.shortening = true;
                try {
                    const origin = window.location.origin;
                    const shortened = {};

                    // Use custom short code if provided, otherwise let backend generate it once
                    let shortCode = this.customShortCode.trim();
                    let isFirstRequest = true;

                    // Shorten each link type
                    for (const [type, url] of Object.entries(this.generatedLinks)) {
                        try {
                            let apiUrl = `${origin}/shorten-v2?url=${encodeURIComponent(url)}`;

                            // For the first request, either use custom code or let backend generate
                            // For subsequent requests, use the code from first request
                            if (shortCode) {
                                apiUrl += `&shortCode=${encodeURIComponent(shortCode)}`;
                            }

                            const response = await fetch(apiUrl);
                            if (!response.ok) {
                                throw new Error(`Failed to shorten ${type} link`);
                            }
                            const returnedCode = await response.text();

                            // If this is the first request and no custom code was provided,
                            // use the backend-generated code for all subsequent requests
                            if (isFirstRequest && !shortCode) {
                                shortCode = returnedCode;
                            }
                            isFirstRequest = false;

                            // Map types to their corresponding path prefixes
                            const prefixMap = {
                                xray: 'x',
                                singbox: 'b',
                                clash: 'c',
                                surge: 's'
                            };

                            shortened[type] = `${origin}/${prefixMap[type]}/${returnedCode}`;
                        } catch (error) {
                            console.error(`Error shortening ${type} link:`, error);
                            throw error;
                        }
                    }

                    this.shortenedLinks = shortened;
                } catch (error) {
                    console.error('Error shortening links:', error);
                    alert(window.APP_TRANSLATIONS.shortenFailed);
                } finally {
                    this.shortening = false;
                }
            }
        }
    }
};
