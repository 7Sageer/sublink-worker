import {checkStartsWith} from "../utils";
// 定义语言包
const translations = {
  'zh-CN': {
    missingInput: '缺少输入参数',
    missingConfig: '缺少配置参数',
    missingUrl: '缺少URL参数',
    shortUrlNotFound: '短链接未找到',
    internalError: '内部服务器错误',
    notFound: '未找到',
    invalidFormat: '无效格式：',
    defaultRules: ['广告拦截', '谷歌服务', '国外媒体', '电报消息'],
    configValidationError: '配置验证错误：',
    pageDescription: 'Sublink Worker - 订阅链接转换工具',
    pageKeywords: '订阅链接,转换,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - 订阅链接转换工具',
    ogTitle: 'Sublink Worker - 订阅链接转换工具',
    ogDescription: '一个强大的订阅链接转换工具，支持多种客户端格式',
    shareUrls: '分享链接',
    urlPlaceholder: '在此输入您的订阅链接...',
    advancedOptions: '高级选项',
    baseConfigSettings: '基础配置设置',
    baseConfigTooltip: '在此处自定义您的基础配置',
    saveConfig: '保存配置',
    clearConfig: '清除配置',
    convert: '转换',
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
    // 规则名称和出站名称的翻译
    outboundNames: {
      'Auto Select': '⚡ 自动选择',
      'Node Select': '🚀 节点选择',
      'Fall Back': '🐟 漏网之鱼',
      'Ad Block': '🛑 广告拦截',
      'AI Services': '💬 AI 服务',
      'Bilibili': '📺 哔哩哔哩',
      'Youtube': '📹 油管视频',
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
      'Education': '📚 教育资源',
      'Financial': '💰 金融服务',
      'Cloud Services': '☁️ 云服务',
      'Non-China': '🌐 非中国',
      'GLOBAL': 'GLOBAL'
    }
  },
  'en-US': {
    missingInput: 'Missing input parameter',
    missingConfig: 'Missing config parameter',
    missingUrl: 'Missing URL parameter',
    shortUrlNotFound: 'Short URL not found',
    internalError: 'Internal Server Error',
    notFound: 'Not Found',
    invalidFormat: 'Invalid format: ',
    defaultRules: ['Ad Blocking', 'Google Services', 'Foreign Media', 'Telegram'],
    configValidationError: 'Config validation error: ',
    pageDescription: 'Sublink Worker - Subscription Link Converter',
    pageKeywords: 'subscription link,converter,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - Subscription Link Converter',
    ogTitle: 'Sublink Worker - Subscription Link Converter',
    ogDescription: 'A powerful subscription link converter supporting multiple client formats',
    shareUrls: 'Share URLs',
    urlPlaceholder: 'Enter your subscription links here...',
    advancedOptions: 'Advanced Options',
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
    outboundNames:{
      'Auto Select': '⚡ Auto Select',
      'Node Select': '🚀 Node Select',
      'Fall Back': '🐟 Fall Back',
      'Ad Block': '🛑 Ad Blocking',
      'AI Services': '💬 AI Services',
      'Bilibili': '📺 Bilibili',
      'Youtube': '📹 Youtube',
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
      'Education': '📚 Education Resources',
      'Financial': '💰 Financial Services',
      'Cloud Services': '☁️ Cloud Services',
      'Non-China': '🌐 Non-China',
      'GLOBAL': 'GLOBAL'
    }
  },
  'ar': {
    missingInput: 'معلمة الإدخال مفقودة',
    missingConfig: 'معلمة التكوين مفقودة',
    missingUrl: 'معلمة URL مفقودة',
    shortUrlNotFound: 'لم يتم العثور على الرابط المختصر',
    internalError: 'خطأ داخلي في الخادم',
    notFound: 'غير موجود',
    invalidFormat: 'تنسيق غير صالح: ',
    defaultRules: ['حظر الإعلانات', 'خدمات جوجل', 'وسائط أجنبية', 'تيليجرام'],
    configValidationError: 'خطأ في التحقق من صحة التكوين: ',
    pageDescription: 'Sublink Worker - محول روابط الاشتراك',
    pageKeywords: 'رابط الاشتراك,محول,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - محول روابط الاشتراك',
    ogTitle: 'Sublink Worker - محول روابط الاشتراك',
    ogDescription: 'محول قوي لروابط الاشتراك يدعم تنسيقات عملاء متعددة',
    shareUrls: 'مشاركة الروابط',
    urlPlaceholder: 'أدخل روابط الاشتراك الخاصة بك هنا...',
    advancedOptions: 'خيارات متقدمة',
    baseConfigSettings: 'إعدادات التكوين الأساسي',
    baseConfigTooltip: 'قم بتخصيص التكوين الأساسي الخاص بك هنا',
    saveConfig: 'حفظ التكوين',
    clearConfig: 'مسح التكوين',
    convert: 'تحويل',
    clear: 'مسح',
    customPath: 'مسار مخصص',
    savedPaths: 'المسارات المحفوظة',
    shortenLinks: 'إنشاء روابط قصيرة',
    ruleSelection: 'اختيار القواعد',
    ruleSelectionTooltip: 'حدد مجموعات القواعد المطلوبة',
    custom: 'مخصص',
    minimal: 'الحد الأدنى',
    balanced: 'متوازن',
    comprehensive: 'شامل',
    addCustomRule: 'إضافة قاعدة مخصصة',
    customRuleOutboundName: 'اسم المخرج*',
    customRuleGeoSite: 'قواعد Geo-Site',
    customRuleGeoSiteTooltip: 'قواعد SingBox Site تأتي من https://github.com/lyc8503/sing-box-rules، مما يعني أن قواعدك المخصصة يجب أن تكون في هذا المستودع',
    customRuleGeoSitePlaceholder: 'مثال: google,anthropic',
    customRuleGeoIP: 'قواعد Geo-IP',
    customRuleGeoIPTooltip: 'قواعد SingBox IP تأتي من https://github.com/lyc8503/sing-box-rules، مما يعني أن قواعدك المخصصة يجب أن تكون في هذا المستودع',
    customRuleGeoIPPlaceholder: 'مثال: private,cn',
    customRuleDomainSuffix: 'لاحقة النطاق',
    customRuleDomainSuffixPlaceholder: 'لواحق النطاق (مفصولة بفواصل)',
    customRuleDomainKeyword: 'كلمة مفتاحية للنطاق',
    customRuleDomainKeywordPlaceholder: 'الكلمات المفتاحية للنطاق (مفصولة بفواصل)',
    customRuleIPCIDR: 'IP CIDR',
    customRuleIPCIDRPlaceholder: 'IP CIDR (مفصولة بفواصل)',
    customRuleProtocol: 'نوع البروتوكول',
    customRuleProtocolTooltip: 'قواعد البروتوكول لأنواع محددة من حركة المرور. مزيد من التفاصيل: https://sing-box.sagernet.org/configuration/route/sniff/',
    customRuleProtocolPlaceholder: 'البروتوكولات (مفصولة بفواصل، مثال: http,ssh,dns)',
    removeCustomRule: 'إزالة',
    outboundNames: {
      'Auto Select': '⚡ تحديد تلقائي',
      'Node Select': '🚀 اختيار العقدة',
      'Fall Back': '🐟 العودة',
      'Ad Block': '🛑 حظر الإعلانات',
      'AI Services': '💬 خدمات الذكاء الاصطناعي',
      'Bilibili': '📺 بيلي بيلي',
      'Youtube': '📹 يوتيوب',
      'Google': '🔍 خدمات جوجل',
      'Private': '🏠 شبكة خاصة',
      'Location:CN': '🔒 خدمات الصين',
      'Telegram': '📲 تيليجرام',
      'Github': '🐱 جيثب',
      'Microsoft': 'Ⓜ️ خدمات مايكروسوفت',
      'Apple': '🍏 خدمات آبل',
      'Social Media': '🌐 وسائل التواصل الاجتماعي',
      'Streaming': '🎬 بث الوسائط',
      'Gaming': '🎮 منصة الألعاب',
      'Education': '📚 موارد تعليمية',
      'Financial': '💰 خدمات مالية',
      'Cloud Services': '☁️ خدمات سحابية',
      'Non-China': '🌐 خارج الصين',
      'GLOBAL': 'GLOBAL'
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
  } else if(checkStartsWith(lang, 'ar')) {
    currentLang = 'ar';
  } else {
    currentLang = 'zh-CN';
  }
}

// 获取翻译
export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
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
