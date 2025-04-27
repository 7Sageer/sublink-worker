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
    },
    UASettings: '自定义UserAgent',
    UAtip: '默认值curl/7.74.0'
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
    },
    UASettings: 'Custom UserAgent',
    UAtip: 'By default it will use curl/7.74.0'
  },
  'fa': {
    missingInput: 'پارامتر ورودی وجود ندارد',
    missingConfig: 'پارامتر پیکربندی وجود ندارد',
    missingUrl: 'پارامتر URL وجود ندارد',
    shortUrlNotFound: 'لینک کوتاه پیدا نشد',
    internalError: 'خطای داخلی سرور',
    notFound: 'یافت نشد',
    invalidFormat: 'فرمت نامعتبر: ',
    defaultRules: ['مسدودسازی تبلیغات', 'سرویس‌های گوگل', 'رسانه‌های خارجی', 'تلگرام'],
    configValidationError: 'خطای اعتبارسنجی پیکربندی: ',
    pageDescription: 'Sublink Worker - مبدل لینک اشتراک',
    pageKeywords: 'لینک اشتراک,مبدل,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - مبدل لینک اشتراک',
    ogTitle: 'Sublink Worker - مبدل لینک اشتراک',
    ogDescription: 'یک مبدل قدرتمند لینک اشتراک با پشتیبانی از فرمت‌های مختلف',
    shareUrls: 'اشتراک‌گذاری لینک‌ها',
    urlPlaceholder: 'لینک‌های اشتراک خود را اینجا وارد کنید...',
    advancedOptions: 'گزینه‌های پیشرفته',
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
    outboundNames: {
      'Auto Select': '⚡ انتخاب خودکار',
      'Node Select': '🚀 انتخاب نود',
      'Fall Back': '🐟 فال بک',
      'Ad Block': '🛑 مسدودسازی تبلیغات',
      'AI Services': '💬 سرویس‌های هوش مصنوعی',
      'Bilibili': '📺 بیلی‌بیلی',
      'Youtube': '📹 یوتیوب',
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
      'Education': '📚 منابع آموزشی',
      'Financial': '💰 سرویس‌های مالی',
      'Cloud Services': '☁️ سرویس‌های ابری',
      'Non-China': '🌐 خارج از چین',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: 'Custom UserAgent',
    UAtip: 'By default it will use curl/7.74.0'
  },
  'ru': {
    missingInput: 'Отсутствует входной параметр',
    missingConfig: 'Отсутствует параметр конфигурации',
    missingUrl: 'Отсутствует параметр URL',
    shortUrlNotFound: 'Короткая ссылка не найдена',
    internalError: 'Внутренняя ошибка сервера',
    notFound: 'Не найдено',
    invalidFormat: 'Недопустимый формат: ',
    defaultRules: ['Блокировка рекламы', 'Сервисы Google', 'Зарубежные медиа', 'Telegram'],
    configValidationError: 'Ошибка проверки конфигурации: ',
    pageDescription: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    pageKeywords: 'ссылка подписки,преобразование,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    ogTitle: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    ogDescription: 'Мощный инструмент для преобразования ссылок подписки, поддерживающий различные форматы клиентов',
    shareUrls: 'Поделиться ссылками',
    urlPlaceholder: 'Введите здесь ваши ссылки подписки...',
    advancedOptions: 'Расширенные настройки',
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
    outboundNames: {
      'Auto Select': '⚡ Автовыбор',
      'Node Select': '🚀 Выбор узла',
      'Fall Back': '🐟 Резерв',
      'Ad Block': '🛑 Блокировка рекламы',
      'AI Services': '💬 AI-сервисы',
      'Bilibili': '📺 Bilibili',
      'Youtube': '📹 YouTube',
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
      'Education': '📚 Образовательные ресурсы',
      'Financial': '💰 Финансовые сервисы',
      'Cloud Services': '☁️ Облачные сервисы',
      'Non-China': '🌐 За пределами Китая',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: 'Пользовательский UserAgent',
    UAtip: 'По умолчанию используется curl/7.74.0'
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
