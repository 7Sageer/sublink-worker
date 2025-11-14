import {checkStartsWith} from "../utils.js";
// 定义语言包
const translations = {
  'zh-CN': {
    missingInput: '缺少输入参数',
    missingConfig: '缺少配置参数',
    missingUrl: '缺少URL参数',
    shortUrlNotFound: '短链接未找到',
    invalidShortUrl: '无效的短链接',
    internalError: '内部服务器错误',
    notFound: '未找到',
    invalidFormat: '无效格式：',
    defaultRules: ['广告拦截', '谷歌服务', '国外媒体', '电报消息'],
    configValidationError: '配置验证错误：',
    pageDescription: '在线订阅链接转换工具',
    pageKeywords: '订阅链接,转换,V2rayN,SingBox,Clash,Surge',
    pageTitle: '在线订阅转换',
    ogTitle: '在线订阅链接转换工具',
    ogDescription: '一个强大的订阅链接转换工具，支持多种客户端格式',
    shareUrls: '订阅链接或单节点',
    urlPlaceholder: '在此输入base64(V2rayN)订阅链接或单节点(每行一个). . .',
    advancedOptions: '自定义规则',
    baseConfigSettings: '基础配置设置',
    baseConfigTooltip: '在此处自定义您的基础配置',
    saveConfig: '保存配置',
    clearConfig: '清除配置',
    convert: '开始转换',
    clear: '清除',
    customPath: '自定义路径',
    savedPaths: '已保存的路径',
    shortenLinks: '生成短链接',
    ruleSelection: '规则选择',
    ruleSelectionTooltip: '选择您需要的规则集',
    custom: '自定义',
    minimal: '最小化',
    balanced: '均衡',
    comprehensive: '全面',
    addCustomRule: '添加自定义规则',
    customRuleOutboundName: '出站名称*',
    customRuleGeoSite: 'Geo-Site规则集',
    customRuleGeoSiteTooltip: 'SingBox中的Site规则来自 https://github.com/lyc8503/sing-box-rules，这意味着您的自定义规则必须在该仓库中',
    customRuleGeoSitePlaceholder: '例如：google,anthropic',
    customRuleGeoIP: 'Geo-IP规则集',
    customRuleGeoIPTooltip: 'SingBox中的IP规则来自 https://github.com/lyc8503/sing-box-rules，这意味着您的自定义规则必须在该仓库中',
    customRuleGeoIPPlaceholder: '例如：private,cn',
    customRuleDomainSuffix: '域名后缀',
    customRuleDomainSuffixPlaceholder: '域名后缀（用逗号分隔）',
    customRuleDomainKeyword: '域名关键词',
    customRuleDomainKeywordPlaceholder: '域名关键词（用逗号分隔）',
    customRuleIPCIDR: 'IP CIDR',
    customRuleIPCIDRPlaceholder: 'IP CIDR（用逗号分隔）',
    customRuleProtocol: '协议类型',
    customRuleProtocolTooltip: '特定流量类型的协议规则。更多详情：https://sing-box.sagernet.org/configuration/route/sniff/',
    customRuleProtocolPlaceholder: '协议（用逗号分隔，例如：http,ssh,dns）',
    removeCustomRule: '移除',
    addCustomRuleJSON: '添加JSON规则',
    customRuleJSON: 'JSON规则',
    customRuleJSONTooltip: '使用JSON格式添加自定义规则，支持批量添加',
    customRulesSection: '自定义规则',
    customRulesSectionTooltip: '创建自定义路由规则来控制特定流量的路由行为。支持表单和JSON两种编辑方式，可以相互转换。',
    customRulesForm: '表单视图',
    customRulesJSON: 'JSON视图',
    customRule: '自定义规则',
    convertToJSON: '转换为JSON',
    convertToForm: '转换为表单',
    validateJSON: '验证JSON',
    clearAll: '清空所有',
    addJSONRule: '添加JSON规则',
    noCustomRulesForm: '点击"添加自定义规则"开始创建规则',
    noCustomRulesJSON: '点击"添加JSON规则"开始创建规则',
    confirmClearAllRules: '确定要清空所有自定义规则吗？',
    noFormRulesToConvert: '没有表单规则可以转换',
    noValidJSONToConvert: '没有有效的JSON规则可以转换',
    convertedFromForm: '从表单转换',
    convertedFromJSON: '从JSON转换',
    mustBeArray: '必须是数组格式',
    nameRequired: '规则名称是必需的',
    invalidJSON: '无效的JSON格式',
    allJSONValid: '所有JSON规则都有效！',
    jsonValidationErrors: 'JSON验证错误',
    // 规则名称和出站名称的翻译
    outboundNames: {
      'Auto Select': '♻️ 自动选择',
      'Node Select': '🚀 节点选择',
      'Fall Back': '🐟 漏网之鱼',
      'Ad Block': '🚫 广告拦截',
      'AI Services': '🤖 AI 服务',
      'Bilibili': '📺 哔哩哔哩',
      'Youtube': '▶️ 油管视频',
      'Google': '🔍 谷歌服务',
      'Private': '🏠 私有网络',
      'Location:CN': '🔒 国内服务',
      'Telegram': '📲 电报消息',
      'Github': '🐱 Github',
      'Microsoft': 'Ⓜ️ 微软服务',
      'Apple': '🍏 苹果服务',
      'Social Media': '🌐 社交媒体',
      'Streaming': '🎬 流媒体',
      'Gaming': '🎮 游戏平台',
      'Education': '🎓 教育资源',
      'Financial': '💰 金融服务',
      'Cloud Services': '☁️ 云服务',
      'Non-China': '🌏 非中国',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: '自定义UserAgent',
    UAtip: '默认值curl/7.74.0',
    apiDoc: {
      title: 'API 文档',
      back: '返回首页',
      nav: {
        main: '主要接口',
        params: '参数说明',
        examples: '示例',
        response: '返回格式',
        more: '更多'
      },
      intro: '本项目支持多种订阅转换、短链生成等 API，适合自动化脚本、第三方集成等场景，可直接将带参数的链接放进代理软件直接订阅，无需打开网页手动转换。',
      mainList: [
        { path: 'GET /singbox?config=...', desc: '生成 Singbox 配置' },
        { path: 'GET /clash?config=...', desc: '生成 Clash 配置' },
        { path: 'GET /surge?config=...', desc: '生成 Surge 配置' },
        { path: 'GET /xray?config=...', desc: '生成 Xray 配置' },
        { path: 'GET /shorten?url=...', desc: '生成短链' },
        { path: 'GET /b/:code /c/:code /x/:code /s/:code', desc: '短链跳转' },
        { path: 'POST /config', desc: '存储自定义配置' }
      ],
      params: [
        { key: 'config', desc: '必填，原始订阅内容（Base64或明文）' },
        { key: 'selectedRules', desc: '可选，预设规则集 key 或自定义规则' },
        { key: 'customRules', desc: '可选，自定义规则（JSON）' },
        { key: 'lang', desc: '可选，界面语言（zh-CN/en/fa/ru）' },
        { key: 'ua', desc: '可选，User-Agent' }
      ],
      examples: [
        {
          title: 'Singbox 配置示例',
          example: 'https://your-domain/singbox?config=订阅链接或单节点',
          desc: 'config 参数支持订阅链接（Base64）或单节点(多个订阅链接或多个单节点用","或"%0A"或"\\n"分隔)，可直接将拼接的链接作为订阅链接实时更新节点'
        },
        {
          title: 'Clash 配置示例',
          example: 'https://your-domain/clash?config=订阅链接或单节点',
          desc: 'config 参数支持订阅链接（Base64）或单节点(多个订阅链接或多个单节点用","或"%0A"或"\\n"分隔)，可直接将拼接的链接作为订阅链接实时更新节点'
        },
        {
          title: 'Surge 配置示例',
          example: 'https://your-domain/surge?config=订阅链接或单节点',
          desc: 'config 参数支持订阅链接（Base64）或单节点(多个订阅链接或多个单节点用","或"%0A"或"\\n"分隔)，可直接将拼接的链接作为订阅链接实时更新节点'
        },
        {
          title: 'Xray 配置示例',
          example: 'https://your-domain/xray?config=订阅链接或单节点',
          desc: 'config 参数支持订阅链接（Base64）或单节点(多个订阅链接或多个单节点用","或"%0A"或"\\n"分隔)，可直接将拼接的链接作为订阅链接实时更新节点'
        },
        {
          title: '生成短链',
          example: 'https://your-domain/shorten?url=https://your-domain/clash?config=订阅链接或单节点',
          desc: 'url 参数为需要生成短链的完整链接，可直接将生成的作为订阅链接实时更新'
        },
        {
          title: '短链跳转',
          example: 'https://your-domain/c/xxxxxxx',
          desc: 'xxxxxxx 为短链生成的 code，支持 /b/、/c/、/s/、/x/ 四种前缀'
        },
        {
          title: '存储自定义配置',
          example: 'POST https://your-domain/config',
          desc: 'type 支持 clash/singbox/surge/xray，content 为配置内容（JSON 或 YAML 字符串）',
          extra: 'Content-Type: application/json\n{\n  "type": "clash",\n  "content": "..."\n}'
        }
      ],
      response: [
        '配置接口返回 YAML/JSON/明文',
        '短链接口返回 JSON 或 302 跳转',
        '错误时返回 4xx/5xx 状态码及错误信息'
      ],
      more: [
        '详细参数和进阶用法请参考 <a href="https://github.com/eooce/sub-converter/blob/main/docs/APIDoc.md" target="_blank">APIDoc.md</a>',
        '如有疑问欢迎 issue 或 PR'
      ],
      labels: {
        example: '示例：',
        desc: '说明：'
      },
    },
  },
  'en-US': {
    missingInput: 'Missing input parameter',
    missingConfig: 'Missing config parameter',
    missingUrl: 'Missing URL parameter',
    shortUrlNotFound: 'Short URL not found',
    invalidShortUrl: 'Invalid short URL',
    internalError: 'Internal Server Error',
    notFound: 'Not Found',
    invalidFormat: 'Invalid format: ',
    defaultRules: ['Ad Blocking', 'Google Services', 'Foreign Media', 'Telegram'],
    configValidationError: 'Config validation error: ',
    pageDescription: 'Subscription Link Converter',
    pageKeywords: 'subscription link,converter,Xray,SingBox,Clash,Surge',
    pageTitle: 'Subscription Link Converter',
    ogTitle: 'Subscription Link Converter',
    ogDescription: 'A powerful subscription link converter supporting multiple client formats',
    shareUrls: 'Subscription Link',
    urlPlaceholder: 'Enter your base64(V2rayN) subscription link here...',
    advancedOptions: 'Custom Rules',
    baseConfigSettings: 'Base Config Settings',
    baseConfigTooltip: 'Customize your base configuration here',
    saveConfig: 'Save Config',
    clearConfig: 'Clear Config',
    convert: 'Convert',
    clear: 'Clear',
    customPath: 'Custom Path',
    savedPaths: 'Saved Paths',
    shortenLinks: 'Generate Short Links',
    ruleSelection: 'Rule Selection',
    ruleSelectionTooltip: 'Select your desired rule sets',
    custom: 'Custom',
    minimal: 'Minimal',
    balanced: 'Balanced',
    comprehensive: 'Comprehensive',
    addCustomRule: 'Add Custom Rule',
    customRuleOutboundName: 'Outbound Name*',
    customRuleGeoSite: 'Geo-Site Rules',
    customRuleGeoSiteTooltip: 'SingBox Site rules come from https://github.com/lyc8503/sing-box-rules, which means your custom rules must be in that repository',
    customRuleGeoSitePlaceholder: 'e.g., google,anthropic',
    customRuleGeoIP: 'Geo-IP Rules',
    customRuleGeoIPTooltip: 'SingBox IP rules come from https://github.com/lyc8503/sing-box-rules, which means your custom rules must be in that repository',
    customRuleGeoIPPlaceholder: 'e.g., private,cn',
    customRuleDomainSuffix: 'Domain Suffix',
    customRuleDomainSuffixPlaceholder: 'Domain suffixes (comma separated)',
    customRuleDomainKeyword: 'Domain Keyword',
    customRuleDomainKeywordPlaceholder: 'Domain keywords (comma separated)',
    customRuleIPCIDR: 'IP CIDR',
    customRuleIPCIDRPlaceholder: 'IP CIDR (comma separated)',
    customRuleProtocol: 'Protocol Type',
    customRuleProtocolTooltip: 'Protocol rules for specific traffic types. More details: https://sing-box.sagernet.org/configuration/route/sniff/',
    customRuleProtocolPlaceholder: 'Protocols (comma separated, e.g., http,ssh,dns)',
    removeCustomRule: 'Remove',
    addCustomRuleJSON: 'Add JSON Rule',
    customRuleJSON: 'JSON Rule',
    customRuleJSONTooltip: 'Add custom rules using JSON format, supports batch adding',
    customRulesSection: 'Custom Rules',
    customRulesSectionTooltip: 'Create custom routing rules to control traffic routing behavior. Supports both form and JSON editing modes with bidirectional conversion.',
    customRulesForm: 'Form View',
    customRulesJSON: 'JSON View',
    customRule: 'Custom Rule',
    convertToJSON: 'Convert to JSON',
    convertToForm: 'Convert to Form',
    validateJSON: 'Validate JSON',
    clearAll: 'Clear All',
    addJSONRule: 'Add JSON Rule',
    noCustomRulesForm: 'Click "Add Custom Rule" to start creating rules',
    noCustomRulesJSON: 'Click "Add JSON Rule" to start creating rules',
    confirmClearAllRules: 'Are you sure you want to clear all custom rules?',
    noFormRulesToConvert: 'No form rules to convert',
    noValidJSONToConvert: 'No valid JSON rules to convert',
    convertedFromForm: 'Converted from Form',
    convertedFromJSON: 'Converted from JSON',
    mustBeArray: 'Must be an array format',
    nameRequired: 'Rule name is required',
    invalidJSON: 'Invalid JSON format',
    allJSONValid: 'All JSON rules are valid!',
    jsonValidationErrors: 'JSON validation errors',
    outboundNames:{
      'Auto Select': '♻️ Auto Select',
      'Node Select': '🚀 Node Select',
      'Fall Back': '🐟 Fall Back',
      'Ad Block': '🚫 Ad Blocking',
      'AI Services': '🤖 AI Services',
      'Bilibili': '📺 Bilibili',
      'Youtube': '▶️ Youtube',
      'Google': '🔍 Google Services',
      'Private': '🏠 Private Network',
      'Location:CN': '🔒 China Services',
      'Telegram': '📲 Telegram',
      'Github': '🐱 Github',
      'Microsoft': 'Ⓜ️ Microsoft Services',
      'Apple': '🍏 Apple Services',
      'Social Media': '🌐 Social Media',
      'Streaming': '🎬 Streaming',
      'Gaming': '🎮 Gaming Platform',
      'Education': '🎓 Education Resources',
      'Financial': '💰 Financial Services',
      'Cloud Services': '☁️ Cloud Services',
      'Non-China': '🌏 Non-China',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: 'Custom UserAgent',
    UAtip: 'By default it will use curl/7.74.0',
    apiDoc: {
      title: 'API Doc',
      back: 'Back to Home',
      nav: {
        main: 'Main Endpoints',
        params: 'Parameters',
        examples: 'Examples',
        response: 'Response Format',
        more: 'More'
      },
      intro: 'This project supports various subscription conversion and short link generation APIs, suitable for automation scripts and third-party integration. You can directly use the parameterized link in your proxy software without manual conversion.',
      mainList: [
        { path: 'GET /singbox?config=...', desc: 'Generate Singbox config' },
        { path: 'GET /clash?config=...', desc: 'Generate Clash config' },
        { path: 'GET /surge?config=...', desc: 'Generate Surge config' },
        { path: 'GET /xray?config=...', desc: 'Generate Xray config' },
        { path: 'GET /shorten?url=...', desc: 'Generate short link' },
        { path: 'GET /b/:code /c/:code /x/:code /s/:code', desc: 'Short link redirect' },
        { path: 'POST /config', desc: 'Store custom config' }
      ],
      params: [
        { key: 'config', desc: 'Required, original subscription content (Base64 or plain text)' },
        { key: 'selectedRules', desc: 'Optional, preset rule set key or custom rules' },
        { key: 'customRules', desc: 'Optional, custom rules (JSON)' },
        { key: 'lang', desc: 'Optional, interface language (zh-CN/en/fa/ru)' },
        { key: 'ua', desc: 'Optional, User-Agent' }
      ],
      examples: [
        {
          title: 'Singbox Example',
          example: 'https://your-domain/singbox?config=subscription or node',
          desc: 'config supports subscription (Base64) or single node(Multiple subscription links or multiple single nodes separated by “,” or "%0A" or "\\n"), can be used as a real-time updating subscription link'
        },
        {
          title: 'Clash Example',
          example: 'https://your-domain/clash?config=subscription or node',
          desc: 'config supports subscription (Base64) or single node(Multiple subscription links or multiple single nodes separated by “,” or "%0A" or "\\n"), can be used as a real-time updating subscription link'
        },
        {
          title: 'Surge Example',
          example: 'https://your-domain/surge?config=subscription or node',
          desc: 'config supports subscription (Base64) or single node(Multiple subscription links or multiple single nodes separated by “,” or "%0A" or "\\n"), can be used as a real-time updating subscription link'
        },
        {
          title: 'Xray Example',
          example: 'https://your-domain/xray?config=subscription or node',
          desc: 'config supports subscription (Base64) or single node(Multiple subscription links or multiple single nodes separated by “,” or "%0A" or "\\n"), can be used as a real-time updating subscription link'
        },
        {
          title: 'Shorten',
          example: 'https://your-domain/shorten?url=https://your-domain/clash?config=subscription or node',
          desc: 'url is the full link to be shortened, can be used as a real-time updating subscription link'
        },
        {
          title: 'Short Link Redirect',
          example: 'https://your-domain/c/xxxxxxx',
          desc: 'xxxxxxx is the code generated by the short link, supports /b/, /c/, /s/, /x/ prefixes'
        },
        {
          title: 'Store Custom Config',
          example: 'POST https://your-domain/config',
          desc: 'type supports clash/singbox/surge/xray, content is the config content (JSON or YAML string)',
          extra: 'Content-Type: application/json\n{\n  "type": "clash",\n  "content": "..."\n}'
        }
      ],
      response: [
        'Config endpoints return YAML/JSON/plain text',
        'Short link endpoints return JSON or 302 redirect',
        'On error, returns 4xx/5xx status code and error message'
      ],
      more: [
        'See <a href="https://github.com/eooce/sub-converter/blob/main/docs/APIDoc.md" target="_blank">APIDoc.md</a> for advanced usage',
        'For questions, welcome issue or PR'
      ],
      labels: {
        example: 'Example:',
        desc: 'Note:'
      },
    },
  },
  'fa': {
    missingInput: 'پارامتر ورودی وجود ندارد',
    missingConfig: 'پارامتر پیکربندی وجود ندارد',
    missingUrl: 'پارامتر URL وجود ندارد',
    shortUrlNotFound: 'لینک کوتاه پیدا نشد',
    invalidShortUrl: 'لینک کوتاه نامعتبر',
    internalError: 'خطای داخلی سرور',
    notFound: 'یافت نشد',
    invalidFormat: 'فرمت نامعتبر: ',
    defaultRules: ['مسدودسازی تبلیغات', 'سرویس‌های گوگل', 'رسانه‌های خارجی', 'تلگرام'],
    configValidationError: 'خطای اعتبارسنجی پیکربندی: ',
    pageDescription: 'محول الاشتراک',
    pageKeywords: 'لینک اشتراک,مبدل,Xray,SingBox,Clash,Surge',
    pageTitle: 'محول الاشتراک',
    ogTitle: 'محول الاشتراک',
    ogDescription: 'یک مبدل قدرتمند لینک اشتراک با پشتیبانی از فرمت‌های مختلف',
    shareUrls: 'لینک اشتراک',
    urlPlaceholder: 'لینک‌های اشتراک خود را اینجا وارد کنید...',
    advancedOptions: 'قوانین سفارشی',
    baseConfigSettings: 'تنظیمات پیکربندی پایه',
    baseConfigTooltip: 'پیکربندی پایه خود را اینجا سفارشی کنید',
    saveConfig: 'ذخیره پیکربندی',
    clearConfig: 'پاک کردن پیکربندی',
    convert: 'تبدیل',
    clear: 'پاک کردن',
    customPath: 'مسیر سفارشی',
    savedPaths: 'مسیرهای ذخیره شده',
    shortenLinks: 'ایجاد لینک‌های کوتاه',
    ruleSelection: 'انتخاب قوانین',
    ruleSelectionTooltip: 'مجموعه قوانین مورد نظر خود را انتخاب کنید',
    custom: 'سفارشی',
    minimal: 'حداقل',
    balanced: 'متعادل',
    comprehensive: 'جامع',
    addCustomRule: 'افزودن قانون سفارشی',
    customRuleOutboundName: 'نام خروجی*',
    customRuleGeoSite: 'قوانین Geo-Site',
    customRuleGeoSiteTooltip: 'قوانین SingBox Site از https://github.com/lyc8503/sing-box-rules می‌آیند، به این معنی که قوانین سفارشی شما باید در آن مخزن باشد',
    customRuleGeoSitePlaceholder: 'برای مثال: google,anthropic',
    customRuleGeoIP: 'قوانین Geo-IP',
    customRuleGeoIPTooltip: 'قوانین SingBox IP از https://github.com/lyc8503/sing-box-rules می‌آیند، به این معنی که قوانین سفارشی شما باید در آن مخزن باشد',
    customRuleGeoIPPlaceholder: 'برای مثال: private,cn',
    customRuleDomainSuffix: 'پسوند دامنه',
    customRuleDomainSuffixPlaceholder: 'پسوندهای دامنه (با کاما جدا شده)',
    customRuleDomainKeyword: 'کلمه کلیدی دامنه',
    customRuleDomainKeywordPlaceholder: 'کلمات کلیدی دامنه (با کاما جدا شده)',
    customRuleIPCIDR: 'IP CIDR',
    customRuleIPCIDRPlaceholder: 'IP CIDR (با کاما جدا شده)',
    customRuleProtocol: 'نوع پروتکل',
    customRuleProtocolTooltip: 'قوانین پروتکل برای انواع خاص ترافیک. جزئیات بیشتر: https://sing-box.sagernet.org/configuration/route/sniff/',
    customRuleProtocolPlaceholder: 'پروتکل‌ها (با کاما جدا شده، مثلاً: http,ssh,dns)',
    removeCustomRule: 'حذف',
    addCustomRuleJSON: 'افزودن قانون JSON',
    customRuleJSON: 'قانون JSON',
    customRuleJSONTooltip: 'افزودن قوانین سفارشی با استفاده از فرمت JSON، پشتیبانی از افزودن دسته‌ای',
    customRulesSection: 'قوانین سفارشی',
    customRulesSectionTooltip: 'قوانین مسیریابی سفارشی برای کنترل رفتار مسیریابی ترافیک ایجاد کنید. از حالت‌های ویرایش فرم و JSON با تبدیل دوطرفه پشتیبانی می‌کند.',
    customRulesForm: 'نمای فرم',
    customRulesJSON: 'نمای JSON',
    customRule: 'قانون سفارشی',
    convertToJSON: 'تبدیل به JSON',
    convertToForm: 'تبدیل به فرم',
    validateJSON: 'اعتبارسنجی JSON',
    clearAll: 'پاک کردن همه',
    addJSONRule: 'افزودن قانون JSON',
    noCustomRulesForm: 'روی "افزودن قانون سفارشی" کلیک کنید تا شروع به ایجاد قوانین کنید',
    noCustomRulesJSON: 'روی "افزودن قانون JSON" کلیک کنید تا شروع به ایجاد قوانین کنید',
    confirmClearAllRules: 'آیا مطمئن هستید که می‌خواهید همه قوانین سفارشی را پاک کنید؟',
    noFormRulesToConvert: 'هیچ قانون فرمی برای تبدیل وجود ندارد',
    noValidJSONToConvert: 'هیچ قانون JSON معتبری برای تبدیل وجود ندارد',
    convertedFromForm: 'از فرم تبدیل شده',
    convertedFromJSON: 'از JSON تبدیل شده',
    mustBeArray: 'باید در قالب آرایه باشد',
    nameRequired: 'نام قانون الزامی است',
    invalidJSON: 'فرمت JSON نامعتبر',
    allJSONValid: 'همه قوانین JSON معتبر هستند!',
    jsonValidationErrors: 'خطاهای اعتبارسنجی JSON',
    outboundNames: {
      'Auto Select': '♻️ انتخاب خودکار',
      'Node Select': '🚀 انتخاب نود',
      'Fall Back': '🐟 فال بک',
      'Ad Block': '🚫 مسدودسازی تبلیغات',
      'AI Services': '🤖 سرویس‌های هوش مصنوعی',
      'Bilibili': '📺 بیلی‌بیلی',
      'Youtube': '▶️ یوتیوب',
      'Google': '🔍 سرویس‌های گوگل',
      'Private': '🏠 شبکه خصوصی',
      'Location:CN': '🔒 سرویس‌های چین',
      'Telegram': '📲 تلگرام',
      'Github': '🐱 گیت‌هاب',
      'Microsoft': 'Ⓜ️ سرویس‌های مایکروسافت',
      'Apple': '🍏 سرویس‌های اپل',
      'Social Media': '🌐 شبکه‌های اجتماعی',
      'Streaming': '🎬 استریمینگ',
      'Gaming': '🎮 پلتفرم بازی',
      'Education': '🎓 منابع آموزشی',
      'Financial': '💰 سرویس‌های مالی',
      'Cloud Services': '☁️ سرویس‌های ابری',
      'Non-China': '🌏 خارج از چین',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: 'UserAgent سفارشی',
    UAtip: 'به طور پیش‌فرض از curl/7.74.0 استفاده می‌کند',
    apiDoc: {
      title: 'مستندات API',
      back: 'بازگشت به خانه',
      nav: {
        main: 'رابط‌های اصلی',
        params: 'توضیحات پارامترها',
        examples: 'نمونه‌ها',
        response: 'فرمت پاسخ',
        more: 'بیشتر'
      },
      intro: 'این پروژه از تبدیل انواع اشتراک و تولید لینک کوتاه API پشتیبانی می‌کند و برای اسکریپت‌های خودکار و یکپارچه‌سازی شخص ثالث مناسب است. می‌توانید لینک پارامتردار را مستقیماً در نرم‌افزار پروکسی خود استفاده کنید بدون نیاز به تبدیل دستی.',
      mainList: [
        { path: 'GET /singbox?config=...', desc: 'تولید پیکربندی Singbox' },
        { path: 'GET /clash?config=...', desc: 'تولید پیکربندی Clash' },
        { path: 'GET /surge?config=...', desc: 'تولید پیکربندی Surge' },
        { path: 'GET /xray?config=...', desc: 'تولید پیکربندی Xray' },
        { path: 'GET /shorten?url=...', desc: 'تولید لینک کوتاه' },
        { path: 'GET /b/:code /c/:code /x/:code /s/:code', desc: 'ریدایرکت لینک کوتاه' },
        { path: 'POST /config', desc: 'ذخیره پیکربندی سفارشی' }
      ],
      params: [
        { key: 'config', desc: 'اجباری، محتوای اشتراک اصلی (Base64 یا متن ساده)' },
        { key: 'selectedRules', desc: 'اختیاری، کلید مجموعه قوانین پیش‌فرض یا قوانین سفارشی' },
        { key: 'customRules', desc: 'اختیاری، قوانین سفارشی (JSON)' },
        { key: 'lang', desc: 'اختیاری، زبان رابط (zh-CN/en/fa/ru)' },
        { key: 'ua', desc: 'اختیاری، User-Agent' }
      ],
      examples: [
        {
          title: 'نمونه Singbox',
          example: 'https://your-domain/singbox?config=اشتراک یا نود',
          desc: 'پارامتر config از اشتراک (Base64)(روابط اشتراك متعددة أو عقد مفردة متعددة مفصولة بـ ”,“ أو ”\\n“) یا نود تکی پشتیبانی می‌کند و می‌تواند به عنوان لینک اشتراک به‌روزرسانی لحظه‌ای استفاده شود.'
        },
        {
          title: 'نمونه Clash',
          example: 'https://your-domain/clash?config=اشتراک یا نود',
          desc: 'پارامتر config از اشتراک (Base64)(روابط اشتراك متعددة أو عقد مفردة متعددة مفصولة بـ ”,“ أو ”\\n“) یا نود تکی پشتیبانی می‌کند و می‌تواند به عنوان لینک اشتراک به‌روزرسانی لحظه‌ای استفاده شود.'
        },
        {
          title: 'نمونه Surge',
          example: 'https://your-domain/surge?config=اشتراک یا نود',
          desc: 'پارامتر config از اشتراک (Base64)(روابط اشتراك متعددة أو عقد مفردة متعددة مفصولة بـ ”,“ أو ”\\n“) یا نود تکی پشتیبانی می‌کند و می‌تواند به عنوان لینک اشتراک به‌روزرسانی لحظه‌ای استفاده شود.'
        },
        {
          title: 'نمونه Xray',
          example: 'https://your-domain/xray?config=اشتراک یا نود',
          desc: 'پارامتر config از اشتراک (Base64)(روابط اشتراك متعددة أو عقد مفردة متعددة مفصولة بـ ”,“ أو ”\\n“) یا نود تکی پشتیبانی می‌کند و می‌تواند به عنوان لینک اشتراک به‌روزرسانی لحظه‌ای استفاده شود.'
        },
        {
          title: 'تولید لینک کوتاه',
          example: 'https://your-domain/shorten?url=https://your-domain/clash?config=اشتراک یا نود',
          desc: 'پارامتر url لینک کامل مورد نیاز برای کوتاه‌سازی است و می‌تواند به عنوان لینک اشتراک به‌روزرسانی لحظه‌ای استفاده شود.'
        },
        {
          title: 'ریدایرکت لینک کوتاه',
          example: 'https://your-domain/c/xxxxxxx',
          desc: 'xxxxxxx کدی است که توسط لینک کوتاه تولید شده و از پیشوندهای /b/، /c/، /s/، /x/ پشتیبانی می‌کند.'
        },
        {
          title: 'ذخیره پیکربندی سفارشی',
          example: 'POST https://your-domain/config',
          desc: 'type از clash/singbox/surge/xray پشتیبانی می‌کند و content محتوای پیکربندی (رشته JSON یا YAML) است.',
          extra: 'Content-Type: application/json\n{\n  "type": "clash",\n  "content": "..."\n}'
        }
      ],
      response: [
        'رابط‌های پیکربندی YAML/JSON/متن ساده را بازمی‌گردانند.',
        'رابط لینک کوتاه JSON یا ریدایرکت 302 بازمی‌گرداند.',
        'در صورت خطا، کد وضعیت 4xx/5xx و پیام خطا بازمی‌گردد.'
      ],
      more: [
        'برای استفاده پیشرفته به <a href="https://github.com/eooce/sub-converter/blob/main/docs/APIDoc.md" target="_blank">APIDoc.md</a> مراجعه کنید.',
        'در صورت سوال، issue یا PR ارسال کنید.'
      ],
      labels: {
        example: 'نمونه:',
        desc: 'توضیح:'
      }
    }
  },
  'ru': {
    missingInput: 'Отсутствует входной параметр',
    missingConfig: 'Отсутствует параметр конфигурации',
    missingUrl: 'Отсутствует параметр URL',
    shortUrlNotFound: 'Короткая ссылка не найдена',
    invalidShortUrl: 'Недопустимая короткая ссылка',
    internalError: 'Внутренняя ошибка сервера',
    notFound: 'Не найдено',
    invalidFormat: 'Недопустимый формат: ',
    defaultRules: ['Блокировка рекламы', 'Сервисы Google', 'Зарубежные медиа', 'Telegram'],
    configValidationError: 'Ошибка проверки конфигурации: ',
    pageDescription: 'Конвертер подписки',
    pageKeywords: 'ссылка подписки,преобразование,Xray,SingBox,Clash,Surge',
    pageTitle: 'Конвертер подписки',
    ogTitle: 'Конвертер подписки',
    ogDescription: 'Мощный инструмент для преобразования ссылок подписки, поддерживающий различные форматы клиентов',
    shareUrls: 'Ссылка подписки',
    urlPlaceholder: 'Введите здесь вашу base64(V2rayN) ссылку...',
    advancedOptions: 'Пользовательские правила',
    baseConfigSettings: 'Базовые настройки конфигурации',
    baseConfigTooltip: 'Настройте базовую конфигурацию здесь',
    saveConfig: 'Сохранить конфигурацию',
    clearConfig: 'Очистить конфигурацию',
    convert: 'Преобразовать',
    clear: 'Очистить',
    customPath: 'Пользовательский путь',
    savedPaths: 'Сохранённые пути',
    shortenLinks: 'Создать короткие ссылки',
    ruleSelection: 'Выбор правил',
    ruleSelectionTooltip: 'Выберите нужные наборы правил',
    custom: 'Пользовательский',
    minimal: 'Минимальный',
    balanced: 'Сбалансированный',
    comprehensive: 'Полный',
    addCustomRule: 'Добавить пользовательское правило',
    customRuleOutboundName: 'Имя выхода*',
    customRuleGeoSite: 'Правила Geo-Site',
    customRuleGeoSiteTooltip: 'Правила Site в SingBox берутся из https://github.com/lyc8503/sing-box-rules, значит ваши пользовательские правила должны быть в этом репозитории',
    customRuleGeoSitePlaceholder: 'например: google,anthropic',
    customRuleGeoIP: 'Правила Geo-IP',
    customRuleGeoIPTooltip: 'Правила IP в SingBox берутся из https://github.com/lyc8503/sing-box-rules, значит ваши пользовательские правила должны быть в этом репозитории',
    customRuleGeoIPPlaceholder: 'например: private,cn',
    customRuleDomainSuffix: 'Суффикс домена',
    customRuleDomainSuffixPlaceholder: 'Суффиксы домена (через запятую)',
    customRuleDomainKeyword: 'Ключевые слова домена',
    customRuleDomainKeywordPlaceholder: 'Ключевые слова домена (через запятую)',
    customRuleIPCIDR: 'IP CIDR',
    customRuleIPCIDRPlaceholder: 'IP CIDR (через запятую)',
    customRuleProtocol: 'Тип протокола',
    customRuleProtocolTooltip: 'Правила для определённых типов трафика. Подробнее: https://sing-box.sagernet.org/configuration/route/sniff/',
    customRuleProtocolPlaceholder: 'Протоколы (через запятую, например: http,ssh,dns)',
    removeCustomRule: 'Удалить',
    addCustomRuleJSON: 'Добавить правило JSON',
    customRuleJSON: 'Правило JSON',
    customRuleJSONTooltip: 'Добавление пользовательских правил в формате JSON, поддерживает пакетное добавление',
    customRulesSection: 'Пользовательские правила',
    customRulesSectionTooltip: 'Создавайте пользовательские правила маршрутизации для управления поведением маршрутизации трафика. Поддерживает режимы редактирования формы и JSON с двунаправленным преобразованием.',
    customRulesForm: 'Вид формы',
    customRulesJSON: 'Вид JSON',
    customRule: 'Пользовательское правило',
    convertToJSON: 'Конвертировать в JSON',
    convertToForm: 'Конвертировать в форму',
    validateJSON: 'Проверить JSON',
    clearAll: 'Очистить всё',
    addJSONRule: 'Добавить правило JSON',
    noCustomRulesForm: 'Нажмите "Добавить пользовательское правило" чтобы начать создание правил',
    noCustomRulesJSON: 'Нажмите "Добавить правило JSON" чтобы начать создание правил',
    confirmClearAllRules: 'Вы уверены, что хотите очистить все пользовательские правила?',
    noFormRulesToConvert: 'Нет правил формы для конвертации',
    noValidJSONToConvert: 'Нет действительных правил JSON для конвертации',
    convertedFromForm: 'Конвертировано из формы',
    convertedFromJSON: 'Конвертировано из JSON',
    mustBeArray: 'Должно быть в формате массива',
    nameRequired: 'Имя правила обязательно',
    invalidJSON: 'Неверный формат JSON',
    allJSONValid: 'Все правила JSON действительны!',
    jsonValidationErrors: 'Ошибки проверки JSON',
    outboundNames: {
      'Auto Select': '♻️ Автовыбор',
      'Node Select': '🚀 Выбор узла',
      'Fall Back': '🐟 Резерв',
      'Ad Block': '🚫 Блокировка рекламы',
      'AI Services': '🤖 AI-сервисы',
      'Bilibili': '📺 Bilibili',
      'Youtube': '▶️ YouTube',
      'Google': '🔍 Сервисы Google',
      'Private': '🏠 Локальная сеть',
      'Location:CN': '🔒 Сервисы Китая',
      'Telegram': '📲 Telegram',
      'Github': '🐱 GitHub',
      'Microsoft': 'Ⓜ️ Сервисы Microsoft',
      'Apple': '🍏 Сервисы Apple',
      'Social Media': '🌐 Социальные сети',
      'Streaming': '🎬 Стриминг',
      'Gaming': '🎮 Игровые платформы',
      'Education': '🎓 Образовательные ресурсы',
      'Financial': '💰 Финансовые сервисы',
      'Cloud Services': '☁️ Облачные сервисы',
      'Non-China': '🌏 За пределами Китая',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: 'Пользовательский UserAgent',
    UAtip: 'По умолчанию используется curl/7.74.0',
    apiDoc: {
      title: 'Документация API',
      back: 'Назад на главную',
      nav: {
        main: 'Основные эндпоинты',
        params: 'Описание параметров',
        examples: 'Примеры',
        response: 'Формат ответа',
        more: 'Подробнее'
      },
      intro: 'Этот проект поддерживает различные API для конвертации подписок и генерации коротких ссылок, подходит для автоматизации и сторонней интеграции. Вы можете использовать ссылку с параметрами напрямую в прокси-программе без ручного преобразования.',
      mainList: [
        { path: 'GET /singbox?config=...', desc: 'Генерация конфигурации Singbox' },
        { path: 'GET /clash?config=...', desc: 'Генерация конфигурации Clash' },
        { path: 'GET /surge?config=...', desc: 'Генерация конфигурации Surge' },
        { path: 'GET /xray?config=...', desc: 'Генерация конфигурации Xray' },
        { path: 'GET /shorten?url=...', desc: 'Генерация короткой ссылки' },
        { path: 'GET /b/:code /c/:code /x/:code /s/:code', desc: 'Переадресация по короткой ссылке' },
        { path: 'POST /config', desc: 'Сохранить пользовательскую конфигурацию' }
      ],
      params: [
        { key: 'config', desc: 'Обязательный, исходное содержимое подписки (Base64 или текст)' },
        { key: 'selectedRules', desc: 'Необязательный, ключ набора предустановленных правил или пользовательские правила' },
        { key: 'customRules', desc: 'Необязательный, пользовательские правила (JSON)' },
        { key: 'lang', desc: 'Необязательный, язык интерфейса (zh-CN/en/fa/ru)' },
        { key: 'ua', desc: 'Необязательный, User-Agent' }
      ],
      examples: [
        {
          title: 'Пример Singbox',
          example: 'https://your-domain/singbox?config=подписка или нода',
          desc: 'Параметр config поддерживает подписку (Base64) или отдельную ноду(Несколько ссылок на подписку или несколько отдельных узлов, разделенных символами «,» или «\n»), можно использовать как ссылку для обновления подписки в реальном времени.'
        },
        {
          title: 'Пример Clash',
          example: 'https://your-domain/clash?config=подписка или нода',
          desc: 'Параметр config поддерживает подписку (Base64) или отдельную ноду(Несколько ссылок на подписку или несколько отдельных узлов, разделенных символами «,» или «\n»), можно использовать как ссылку для обновления подписки в реальном времени.'
        },
        {
          title: 'Пример Surge',
          example: 'https://your-domain/surge?config=подписка или нода',
          desc: 'Параметр config поддерживает подписку (Base64) или отдельную ноду(Несколько ссылок на подписку или несколько отдельных узлов, разделенных символами «,» или «\n»), можно использовать как ссылку для обновления подписки в реальном времени.'
        },
        {
          title: 'Пример Xray',
          example: 'https://your-domain/xray?config=подписка или нода',
          desc: 'Параметр config поддерживает подписку (Base64) или отдельную ноду(Несколько ссылок на подписку или несколько отдельных узлов, разделенных символами «,» или «\n»), можно использовать как ссылку для обновления подписки в реальном времени.'
        },
        {
          title: 'Генерация короткой ссылки',
          example: 'https://your-domain/shorten?url=https://your-domain/clash?config=подписка или нода',
          desc: 'Параметр url — это полная ссылка для сокращения, можно использовать как ссылку для обновления подписки в реальном времени.'
        },
        {
          title: 'Переадресация по короткой ссылке',
          example: 'https://your-domain/c/xxxxxxx',
          desc: 'xxxxxxx — это код, сгенерированный короткой ссылкой, поддерживаются префиксы /b/, /c/, /s/, /x/.'
        },
        {
          title: 'Сохранить пользовательскую конфигурацию',
          example: 'POST https://your-domain/config',
          desc: 'type поддерживает clash/singbox/surge/xray, content — содержимое конфигурации (строка JSON или YAML).',
          extra: 'Content-Type: application/json\n{\n  "type": "clash",\n  "content": "..."\n}'
        }
      ],
      response: [
        'Эндпоинты конфигурации возвращают YAML/JSON/текст',
        'Эндпоинты коротких ссылок возвращают JSON или 302 redirect',
        'В случае ошибки возвращается код состояния 4xx/5xx и сообщение об ошибке.'
      ],
      more: [
        'Для подробностей и расширенного использования смотрите <a href="https://github.com/eooce/sub-converter/blob/main/docs/APIDoc.md" target="_blank">APIDoc.md</a>.',
        'По вопросам — создавайте issue или PR.'
      ],
      labels: {
        example: 'Пример:',
        desc: 'Описание:'
      }
    }
  }
};

// 当前语言
let currentLang = 'zh-CN';


// 设置语言
export function setLanguage(lang) {
  if(translations[lang]) {
    currentLang = lang;
  } else if(checkStartsWith(lang, 'en')) {
    currentLang = 'en-US';
  } else if(checkStartsWith(lang, 'fa')) {
    currentLang = 'fa';
  } else if(checkStartsWith(lang, 'ru')) {
    currentLang = 'ru';
  } else {
    currentLang = 'zh-CN';
  }
}

// 获取翻译，支持嵌套键值访问
export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  
  // 逐级查找翻译值
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      if (checkStartsWith(key, 'outboundNames.')) {
        return key.split('.')[1];
      }
      // 找不到翻译时返回原始键名
      return key;
    }
  }
  return value;
}

// 获取当前语言
export function getCurrentLang() {
  return currentLang;
}

// 获取默认规则列表
export function getDefaultRules() {
  return translations[currentLang].defaultRules;
}

// 获取出站集
export function getOutbounds(){
  return translations[currentLang].outboundNames;
}
