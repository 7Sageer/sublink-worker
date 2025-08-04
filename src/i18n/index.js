import {checkStartsWith} from "../utils";
// 定义语言包
const translations = {
  'zh-CN': {
    missingInput: 'Missing input parameter',
missingConfig: 'Missing config parameter',
missingUrl: 'Missing URL parameter',
shortUrlNotFound: 'Short link not found',
invalidShortUrl: 'Invalid short link',
internalError: 'Internal server error',
notFound: 'Not found',
invalidFormat: 'Invalid format:',
defaultRules: ['Ad Block', 'Google Services', 'Foreign Media', 'Telegram Messages'],
configValidationError: 'Config validation error:',
pageDescription: 'Sublink Worker - Subscription Link Converter Tool',
pageKeywords: 'subscription link, convert, Xray, SingBox, Clash, Surge',
pageTitle: 'Sublink Worker - Subscription Link Converter Tool',
ogTitle: 'Sublink Worker - Subscription Link Converter Tool',
ogDescription: 'A powerful subscription link converter supporting multiple client formats',
shareUrls: 'Share Links',
urlPlaceholder: 'Enter the share link here (you can paste a previously generated link to quickly parse the configuration)...',
advancedOptions: 'Advanced Options',
baseConfigSettings: 'Base Configuration Settings',
baseConfigTooltip: 'Customize your base configuration here',
saveConfig: 'Save Configuration',
clearConfig: 'Clear Configuration',
convert: 'Convert',
clear: 'Clear',
customPath: 'Custom Path',
savedPaths: 'Saved Paths',
shortenLinks: 'Generate Short Link',
ruleSelection: 'Rule Selection',
ruleSelectionTooltip: 'Select the rule sets you need',
custom: 'Custom',
minimal: 'Minimal',
balanced: 'Balanced',
comprehensive: 'Comprehensive',
addCustomRule: 'Add Custom Rule',
customRuleOutboundName: 'Outbound Name*',
customRuleGeoSite: 'Geo-Site Rule Set',
customRuleGeoSiteTooltip: 'Site rules in SingBox come from https://github.com/lyc8503/sing-box-rules, meaning your custom rules must exist in that repository',
customRuleGeoSitePlaceholder: 'e.g.: google,anthropic',
customRuleGeoIP: 'Geo-IP Rule Set',
customRuleGeoIPTooltip: 'IP rules in SingBox come from https://github.com/lyc8503/sing-box-rules, meaning your custom rules must exist in that repository',
customRuleGeoIPPlaceholder: 'e.g.: private,cn',
customRuleDomainSuffix: 'Domain Suffix',
customRuleDomainSuffixPlaceholder: 'Domain suffix (separated by commas)',
customRuleDomainKeyword: 'Domain Keyword',
customRuleDomainKeywordPlaceholder: 'Domain keywords (separated by commas)',
customRuleIPCIDR: 'IP CIDR',
customRuleIPCIDRPlaceholder: 'IP CIDR (separated by commas)',
customRuleProtocol: 'Protocol Type',
customRuleProtocolTooltip: 'Protocol rules for specific traffic types. More info: https://sing-box.sagernet.org/configuration/route/sniff/',
customRuleProtocolPlaceholder: 'Protocols (comma-separated, e.g.: http,ssh,dns)',
removeCustomRule: 'Remove',
addCustomRuleJSON: 'Add JSON Rule',
customRuleJSON: 'JSON Rule',
customRuleJSONTooltip: 'Add custom rules using JSON format, supports batch addition',
customRulesSection: 'Custom Rules',
customRulesSectionTooltip: 'Create custom routing rules to control traffic behavior. Supports both form and JSON editing, which are interchangeable.',
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
    outboundNames: {
      'Auto Select': '⚡ Auto Select',
      'Node Select': '🚀 Benxx Project',
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
    UASettings: '自定义UserAgent',
    UAtip: '默认值curl/7.74.0'
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
    pageDescription: 'Sublink Worker - Subscription Link Converter',
    pageKeywords: 'subscription link,converter,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - Subscription Link Converter',
    ogTitle: 'Sublink Worker - Subscription Link Converter',
    ogDescription: 'A powerful subscription link converter supporting multiple client formats',
    shareUrls: 'Share URLs',
    urlPlaceholder: 'Enter your share links here (paste previously generated links for quick config parsing)...',
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
    invalidShortUrl: 'لینک کوتاه نامعتبر',
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
    urlPlaceholder: 'لینک‌های اشتراک خود را اینجا وارد کنید (برای تجزیه سریع پیکربندی، لینک‌های تولید شده قبلی را جایگذاری کنید)...',
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
    UASettings: 'UserAgent سفارشی',
    UAtip: 'به طور پیش‌فرض از curl/7.74.0 استفاده می‌کند'
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
    pageDescription: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    pageKeywords: 'ссылка подписки,преобразование,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    ogTitle: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    ogDescription: 'Мощный инструмент для преобразования ссылок подписки, поддерживающий различные форматы клиентов',
    shareUrls: 'Поделиться ссылками',
    urlPlaceholder: 'Введите здесь ваши ссылки (вставьте ранее созданные ссылки для быстрого разбора конфигурации)...',
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
      'Google': 'ðŸ” Ø³Ø±ÙˆÛŒØ³â€ŒÙ‡Ø§ÛŒ Ú¯ÙˆÚ¯Ù„',
      'Private': 'ðŸ  Ø´Ø¨Ú©Ù‡ Ø®ØµÙˆØµÛŒ',
      'Location:CN': 'ðŸ”’ Ø³Ø±ÙˆÛŒØ³â€ŒÙ‡Ø§ÛŒ Ú†ÛŒÙ†',
      'Telegram': 'ðŸ“² ØªÙ„Ú¯Ø±Ø§Ù…',
      'Github': 'ðŸ± Ú¯ÛŒØªâ€ŒÙ‡Ø§Ø¨',
      'Microsoft': 'â“‚ï¸ Ø³Ø±ÙˆÛŒØ³â€ŒÙ‡Ø§ÛŒ Ù…Ø§ÛŒÚ©Ø±ÙˆØ³Ø§ÙØª',
      'Apple': 'ðŸ Ø³Ø±ÙˆÛŒØ³â€ŒÙ‡Ø§ÛŒ Ø§Ù¾Ù„',
      'Social Media': 'ðŸŒ Ø´Ø¨Ú©Ù‡â€ŒÙ‡Ø§ÛŒ Ø§Ø¬ØªÙ…Ø§Ø¹ÛŒ',
      'Streaming': 'ðŸŽ¬ Ø§Ø³ØªØ±ÛŒÙ…ÛŒÙ†Ú¯',
      'Gaming': 'ðŸŽ® Ù¾Ù„ØªÙØ±Ù… Ø¨Ø§Ø²ÛŒ',
      'Education': 'ðŸ“š Ù…Ù†Ø§Ø¨Ø¹ Ø¢Ù…ÙˆØ²Ø´ÛŒ',
      'Financial': 'ðŸ’° Ø³Ø±ÙˆÛŒØ³â€ŒÙ‡Ø§ÛŒ Ù…Ø§Ù„ÛŒ',
      'Cloud Services': 'â˜ï¸ Ø³Ø±ÙˆÛŒØ³â€ŒÙ‡Ø§ÛŒ Ø§Ø¨Ø±ÛŒ',
      'Non-China': 'ðŸŒ Ø®Ø§Ø±Ø¬ Ø§Ø² Ú†ÛŒÙ†',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: 'UserAgent Ø³ÙØ§Ø±Ø´ÛŒ',
    UAtip: 'Ø¨Ù‡ Ø·ÙˆØ± Ù¾ÛŒØ´â€ŒÙØ±Ø¶ Ø§Ø² curl/7.74.0 Ø§Ø³ØªÙØ§Ø¯Ù‡ Ù…ÛŒâ€ŒÚ©Ù†Ø¯'
  },
  'ru': {
    missingInput: 'ÐžÑ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚ Ð²Ñ…Ð¾Ð´Ð½Ð¾Ð¹ Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€',
    missingConfig: 'ÐžÑ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚ Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€ ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸Ð¸',
    missingUrl: 'ÐžÑ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚ Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€ URL',
    shortUrlNotFound: 'ÐšÐ¾Ñ€Ð¾Ñ‚ÐºÐ°Ñ ÑÑÑ‹Ð»ÐºÐ° Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð°',
    invalidShortUrl: 'ÐÐµÐ´Ð¾Ð¿ÑƒÑÑ‚Ð¸Ð¼Ð°Ñ ÐºÐ¾Ñ€Ð¾Ñ‚ÐºÐ°Ñ ÑÑÑ‹Ð»ÐºÐ°',
    internalError: 'Ð’Ð½ÑƒÑ‚Ñ€ÐµÐ½Ð½ÑÑ Ð¾ÑˆÐ¸Ð±ÐºÐ° ÑÐµÑ€Ð²ÐµÑ€Ð°',
    notFound: 'ÐÐµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾',
    invalidFormat: 'ÐÐµÐ´Ð¾Ð¿ÑƒÑÑ‚Ð¸Ð¼Ñ‹Ð¹ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚: ',
    defaultRules: ['Ð‘Ð»Ð¾ÐºÐ¸Ñ€Ð¾Ð²ÐºÐ° Ñ€ÐµÐºÐ»Ð°Ð¼Ñ‹', 'Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ Google', 'Ð—Ð°Ñ€ÑƒÐ±ÐµÐ¶Ð½Ñ‹Ðµ Ð¼ÐµÐ´Ð¸Ð°', 'Telegram'],
    configValidationError: 'ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸ ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸Ð¸: ',
    pageDescription: 'Sublink Worker - Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚ Ð´Ð»Ñ Ð¿Ñ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ð½Ð¸Ñ ÑÑÑ‹Ð»Ð¾Ðº Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸',
    pageKeywords: 'ÑÑÑ‹Ð»ÐºÐ° Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸,Ð¿Ñ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ð½Ð¸Ðµ,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚ Ð´Ð»Ñ Ð¿Ñ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ð½Ð¸Ñ ÑÑÑ‹Ð»Ð¾Ðº Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸',
    ogTitle: 'Sublink Worker - Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚ Ð´Ð»Ñ Ð¿Ñ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ð½Ð¸Ñ ÑÑÑ‹Ð»Ð¾Ðº Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸',
    ogDescription: 'ÐœÐ¾Ñ‰Ð½Ñ‹Ð¹ Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚ Ð´Ð»Ñ Ð¿Ñ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ð½Ð¸Ñ ÑÑÑ‹Ð»Ð¾Ðº Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸, Ð¿Ð¾Ð´Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÑŽÑ‰Ð¸Ð¹ Ñ€Ð°Ð·Ð»Ð¸Ñ‡Ð½Ñ‹Ðµ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ñ‹ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¾Ð²',
    shareUrls: 'ÐŸÐ¾Ð´ÐµÐ»Ð¸Ñ‚ÑŒÑÑ ÑÑÑ‹Ð»ÐºÐ°Ð¼Ð¸',
    urlPlaceholder: 'Ð’Ð²ÐµÐ´Ð¸Ñ‚Ðµ Ð·Ð´ÐµÑÑŒ Ð²Ð°ÑˆÐ¸ ÑÑÑ‹Ð»ÐºÐ¸ (Ð²ÑÑ‚Ð°Ð²ÑŒÑ‚Ðµ Ñ€Ð°Ð½ÐµÐµ ÑÐ¾Ð·Ð´Ð°Ð½Ð½Ñ‹Ðµ ÑÑÑ‹Ð»ÐºÐ¸ Ð´Ð»Ñ Ð±Ñ‹ÑÑ‚Ñ€Ð¾Ð³Ð¾ Ñ€Ð°Ð·Ð±Ð¾Ñ€Ð° ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸Ð¸)...',
    advancedOptions: 'Ð Ð°ÑÑˆÐ¸Ñ€ÐµÐ½Ð½Ñ‹Ðµ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸',
    baseConfigSettings: 'Ð‘Ð°Ð·Ð¾Ð²Ñ‹Ðµ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸Ð¸',
    baseConfigTooltip: 'ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹Ñ‚Ðµ Ð±Ð°Ð·Ð¾Ð²ÑƒÑŽ ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸ÑŽ Ð·Ð´ÐµÑÑŒ',
    saveConfig: 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸ÑŽ',
    clearConfig: 'ÐžÑ‡Ð¸ÑÑ‚Ð¸Ñ‚ÑŒ ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸ÑŽ',
    convert: 'ÐŸÑ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÑŒ',
    clear: 'ÐžÑ‡Ð¸ÑÑ‚Ð¸Ñ‚ÑŒ',
    customPath: 'ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ð¹ Ð¿ÑƒÑ‚ÑŒ',
    savedPaths: 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ñ‘Ð½Ð½Ñ‹Ðµ Ð¿ÑƒÑ‚Ð¸',
    shortenLinks: 'Ð¡Ð¾Ð·Ð´Ð°Ñ‚ÑŒ ÐºÐ¾Ñ€Ð¾Ñ‚ÐºÐ¸Ðµ ÑÑÑ‹Ð»ÐºÐ¸',
    ruleSelection: 'Ð’Ñ‹Ð±Ð¾Ñ€ Ð¿Ñ€Ð°Ð²Ð¸Ð»',
    ruleSelectionTooltip: 'Ð’Ñ‹Ð±ÐµÑ€Ð¸Ñ‚Ðµ Ð½ÑƒÐ¶Ð½Ñ‹Ðµ Ð½Ð°Ð±Ð¾Ñ€Ñ‹ Ð¿Ñ€Ð°Ð²Ð¸Ð»',
    custom: 'ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ð¹',
    minimal: 'ÐœÐ¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹',
    balanced: 'Ð¡Ð±Ð°Ð»Ð°Ð½ÑÐ¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹',
    comprehensive: 'ÐŸÐ¾Ð»Ð½Ñ‹Ð¹',
    addCustomRule: 'Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¾Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾',
    customRuleOutboundName: 'Ð˜Ð¼Ñ Ð²Ñ‹Ñ…Ð¾Ð´Ð°*',
    customRuleGeoSite: 'ÐŸÑ€Ð°Ð²Ð¸Ð»Ð° Geo-Site',
    customRuleGeoSiteTooltip: 'ÐŸÑ€Ð°Ð²Ð¸Ð»Ð° Site Ð² SingBox Ð±ÐµÑ€ÑƒÑ‚ÑÑ Ð¸Ð· https://github.com/lyc8503/sing-box-rules, Ð·Ð½Ð°Ñ‡Ð¸Ñ‚ Ð²Ð°ÑˆÐ¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð° Ð´Ð¾Ð»Ð¶Ð½Ñ‹ Ð±Ñ‹Ñ‚ÑŒ Ð² ÑÑ‚Ð¾Ð¼ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ð¸Ð¸',
    customRuleGeoSitePlaceholder: 'Ð½Ð°Ð¿Ñ€Ð¸Ð¼ÐµÑ€: google,anthropic',
    customRuleGeoIP: 'ÐŸÑ€Ð°Ð²Ð¸Ð»Ð° Geo-IP',
    customRuleGeoIPTooltip: 'ÐŸÑ€Ð°Ð²Ð¸Ð»Ð° IP Ð² SingBox Ð±ÐµÑ€ÑƒÑ‚ÑÑ Ð¸Ð· https://github.com/lyc8503/sing-box-rules, Ð·Ð½Ð°Ñ‡Ð¸Ñ‚ Ð²Ð°ÑˆÐ¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð° Ð´Ð¾Ð»Ð¶Ð½Ñ‹ Ð±Ñ‹Ñ‚ÑŒ Ð² ÑÑ‚Ð¾Ð¼ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ð¸Ð¸',
    customRuleGeoIPPlaceholder: 'Ð½Ð°Ð¿Ñ€Ð¸Ð¼ÐµÑ€: private,cn',
    customRuleDomainSuffix: 'Ð¡ÑƒÑ„Ñ„Ð¸ÐºÑ Ð´Ð¾Ð¼ÐµÐ½Ð°',
    customRuleDomainSuffixPlaceholder: 'Ð¡ÑƒÑ„Ñ„Ð¸ÐºÑÑ‹ Ð´Ð¾Ð¼ÐµÐ½Ð° (Ñ‡ÐµÑ€ÐµÐ· Ð·Ð°Ð¿ÑÑ‚ÑƒÑŽ)',
    customRuleDomainKeyword: 'ÐšÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ðµ ÑÐ»Ð¾Ð²Ð° Ð´Ð¾Ð¼ÐµÐ½Ð°',
    customRuleDomainKeywordPlaceholder: 'ÐšÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ðµ ÑÐ»Ð¾Ð²Ð° Ð´Ð¾Ð¼ÐµÐ½Ð° (Ñ‡ÐµÑ€ÐµÐ· Ð·Ð°Ð¿ÑÑ‚ÑƒÑŽ)',
    customRuleIPCIDR: 'IP CIDR',
    customRuleIPCIDRPlaceholder: 'IP CIDR (Ñ‡ÐµÑ€ÐµÐ· Ð·Ð°Ð¿ÑÑ‚ÑƒÑŽ)',
    customRuleProtocol: 'Ð¢Ð¸Ð¿ Ð¿Ñ€Ð¾Ñ‚Ð¾ÐºÐ¾Ð»Ð°',
    customRuleProtocolTooltip: 'ÐŸÑ€Ð°Ð²Ð¸Ð»Ð° Ð´Ð»Ñ Ð¾Ð¿Ñ€ÐµÐ´ÐµÐ»Ñ‘Ð½Ð½Ñ‹Ñ… Ñ‚Ð¸Ð¿Ð¾Ð² Ñ‚Ñ€Ð°Ñ„Ð¸ÐºÐ°. ÐŸÐ¾Ð´Ñ€Ð¾Ð±Ð½ÐµÐµ: https://sing-box.sagernet.org/configuration/route/sniff/',
    customRuleProtocolPlaceholder: 'ÐŸÑ€Ð¾Ñ‚Ð¾ÐºÐ¾Ð»Ñ‹ (Ñ‡ÐµÑ€ÐµÐ· Ð·Ð°Ð¿ÑÑ‚ÑƒÑŽ, Ð½Ð°Ð¿Ñ€Ð¸Ð¼ÐµÑ€: http,ssh,dns)',
    removeCustomRule: 'Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ',
    addCustomRuleJSON: 'Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾ JSON',
    customRuleJSON: 'ÐŸÑ€Ð°Ð²Ð¸Ð»Ð¾ JSON',
    customRuleJSONTooltip: 'Ð”Ð¾Ð±Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ñ… Ð¿Ñ€Ð°Ð²Ð¸Ð» Ð² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ðµ JSON, Ð¿Ð¾Ð´Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÐµÑ‚ Ð¿Ð°ÐºÐµÑ‚Ð½Ð¾Ðµ Ð´Ð¾Ð±Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ',
    customRulesSection: 'ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð°',
    customRulesSectionTooltip: 'Ð¡Ð¾Ð·Ð´Ð°Ð²Ð°Ð¹Ñ‚Ðµ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð° Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð¸Ð·Ð°Ñ†Ð¸Ð¸ Ð´Ð»Ñ ÑƒÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ñ Ð¿Ð¾Ð²ÐµÐ´ÐµÐ½Ð¸ÐµÐ¼ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð¸Ð·Ð°Ñ†Ð¸Ð¸ Ñ‚Ñ€Ð°Ñ„Ð¸ÐºÐ°. ÐŸÐ¾Ð´Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÐµÑ‚ Ñ€ÐµÐ¶Ð¸Ð¼Ñ‹ Ñ€ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ Ñ„Ð¾Ñ€Ð¼Ñ‹ Ð¸ JSON Ñ Ð´Ð²ÑƒÐ½Ð°Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð½Ñ‹Ð¼ Ð¿Ñ€ÐµÐ¾Ð±Ñ€Ð°Ð·Ð¾Ð²Ð°Ð½Ð¸ÐµÐ¼.',
    customRulesForm: 'Ð’Ð¸Ð´ Ñ„Ð¾Ñ€Ð¼Ñ‹',
    customRulesJSON: 'Ð’Ð¸Ð´ JSON',
    customRule: 'ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¾Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾',
    convertToJSON: 'ÐšÐ¾Ð½Ð²ÐµÑ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð² JSON',
    convertToForm: 'ÐšÐ¾Ð½Ð²ÐµÑ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð² Ñ„Ð¾Ñ€Ð¼Ñƒ',
    validateJSON: 'ÐŸÑ€Ð¾Ð²ÐµÑ€Ð¸Ñ‚ÑŒ JSON',
    clearAll: 'ÐžÑ‡Ð¸ÑÑ‚Ð¸Ñ‚ÑŒ Ð²ÑÑ‘',
    addJSONRule: 'Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾ JSON',
    noCustomRulesForm: 'ÐÐ°Ð¶Ð¼Ð¸Ñ‚Ðµ "Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¾Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾" Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð½Ð°Ñ‡Ð°Ñ‚ÑŒ ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»',
    noCustomRulesJSON: 'ÐÐ°Ð¶Ð¼Ð¸Ñ‚Ðµ "Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾ JSON" Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð½Ð°Ñ‡Ð°Ñ‚ÑŒ ÑÐ¾Ð·Ð´Ð°Ð½Ð¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»',
    confirmClearAllRules: 'Ð’Ñ‹ ÑƒÐ²ÐµÑ€ÐµÐ½Ñ‹, Ñ‡Ñ‚Ð¾ Ñ…Ð¾Ñ‚Ð¸Ñ‚Ðµ Ð¾Ñ‡Ð¸ÑÑ‚Ð¸Ñ‚ÑŒ Ð²ÑÐµ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð°?',
    noFormRulesToConvert: 'ÐÐµÑ‚ Ð¿Ñ€Ð°Ð²Ð¸Ð» Ñ„Ð¾Ñ€Ð¼Ñ‹ Ð´Ð»Ñ ÐºÐ¾Ð½Ð²ÐµÑ€Ñ‚Ð°Ñ†Ð¸Ð¸',
    noValidJSONToConvert: 'ÐÐµÑ‚ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ñ‹Ñ… Ð¿Ñ€Ð°Ð²Ð¸Ð» JSON Ð´Ð»Ñ ÐºÐ¾Ð½Ð²ÐµÑ€Ñ‚Ð°Ñ†Ð¸Ð¸',
    convertedFromForm: 'ÐšÐ¾Ð½Ð²ÐµÑ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¾ Ð¸Ð· Ñ„Ð¾Ñ€Ð¼Ñ‹',
    convertedFromJSON: 'ÐšÐ¾Ð½Ð²ÐµÑ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¾ Ð¸Ð· JSON',
    mustBeArray: 'Ð”Ð¾Ð»Ð¶Ð½Ð¾ Ð±Ñ‹Ñ‚ÑŒ Ð² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ðµ Ð¼Ð°ÑÑÐ¸Ð²Ð°',
    nameRequired: 'Ð˜Ð¼Ñ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð° Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾',
    invalidJSON: 'ÐÐµÐ²ÐµÑ€Ð½Ñ‹Ð¹ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ JSON',
    allJSONValid: 'Ð’ÑÐµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð° JSON Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ñ‹!',
    jsonValidationErrors: 'ÐžÑˆÐ¸Ð±ÐºÐ¸ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸ JSON',
    outboundNames: {
      'Auto Select': 'âš¡ ÐÐ²Ñ‚Ð¾Ð²Ñ‹Ð±Ð¾Ñ€',
      'Node Select': 'ðŸš€ Ð’Ñ‹Ð±Ð¾Ñ€ ÑƒÐ·Ð»Ð°',
      'Fall Back': 'ðŸŸ Ð ÐµÐ·ÐµÑ€Ð²',
      'Ad Block': 'ðŸ›‘ Ð‘Ð»Ð¾ÐºÐ¸Ñ€Ð¾Ð²ÐºÐ° Ñ€ÐµÐºÐ»Ð°Ð¼Ñ‹',
      'AI Services': 'ðŸ’¬ AI-ÑÐµÑ€Ð²Ð¸ÑÑ‹',
      'Bilibili': 'ðŸ“º Bilibili',
      'Youtube': 'ðŸ“¹ YouTube',
      'Google': 'ðŸ” Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ Google',
      'Private': 'ðŸ  Ð›Ð¾ÐºÐ°Ð»ÑŒÐ½Ð°Ñ ÑÐµÑ‚ÑŒ',
      'Location:CN': 'ðŸ”’ Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ ÐšÐ¸Ñ‚Ð°Ñ',
      'Telegram': 'ðŸ“² Telegram',
      'Github': 'ðŸ± GitHub',
      'Microsoft': 'â“‚ï¸ Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ Microsoft',
      'Apple': 'ðŸ Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ Apple',
      'Social Media': 'ðŸŒ Ð¡Ð¾Ñ†Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ðµ ÑÐµÑ‚Ð¸',
      'Streaming': 'ðŸŽ¬ Ð¡Ñ‚Ñ€Ð¸Ð¼Ð¸Ð½Ð³',
      'Gaming': 'ðŸŽ® Ð˜Ð³Ñ€Ð¾Ð²Ñ‹Ðµ Ð¿Ð»Ð°Ñ‚Ñ„Ð¾Ñ€Ð¼Ñ‹',
      'Education': 'ðŸ“š ÐžÐ±Ñ€Ð°Ð·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ñ€ÐµÑÑƒÑ€ÑÑ‹',
      'Financial': 'ðŸ’° Ð¤Ð¸Ð½Ð°Ð½ÑÐ¾Ð²Ñ‹Ðµ ÑÐµÑ€Ð²Ð¸ÑÑ‹',
      'Cloud Services': 'â˜ï¸ ÐžÐ±Ð»Ð°Ñ‡Ð½Ñ‹Ðµ ÑÐµÑ€Ð²Ð¸ÑÑ‹',
      'Non-China': 'ðŸŒ Ð—Ð° Ð¿Ñ€ÐµÐ´ÐµÐ»Ð°Ð¼Ð¸ ÐšÐ¸Ñ‚Ð°Ñ',
      'GLOBAL': 'GLOBAL'
    },
    UASettings: 'ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÑÐºÐ¸Ð¹ UserAgent',
    UAtip: 'ÐŸÐ¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ curl/7.74.0'
  }
};

// å½“å‰è¯­è¨€
let currentLang = 'zh-CN';


// è®¾ç½®è¯­è¨€
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

// èŽ·å–ç¿»è¯‘ï¼Œæ”¯æŒåµŒå¥—é”®å€¼è®¿é—®
export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  
  // é€çº§æŸ¥æ‰¾ç¿»è¯‘å€¼
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      if (checkStartsWith(key, 'outboundNames.')) {
        return key.split('.')[1];
      }
      // æ‰¾ä¸åˆ°ç¿»è¯‘æ—¶è¿”å›žåŽŸå§‹é”®å
      return key;
    }
  }
  return value;
}

// èŽ·å–å½“å‰è¯­è¨€
export function getCurrentLang() {
  return currentLang;
}

// èŽ·å–é»˜è®¤è§„åˆ™åˆ—è¡¨
export function getDefaultRules() {
  return translations[currentLang].defaultRules;
}

// èŽ·å–å‡ºç«™é›†
export function getOutbounds(){
  return translations[currentLang].outboundNames;
}    UAtip: '默认值curl/7.74.0'
  };
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
    pageDescription: 'Sublink Worker - Subscription Link Converter',
    pageKeywords: 'subscription link,converter,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - Subscription Link Converter',
    ogTitle: 'Sublink Worker - Subscription Link Converter',
    ogDescription: 'A powerful subscription link converter supporting multiple client formats',
    shareUrls: 'Share URLs',
    urlPlaceholder: 'Enter your share links here (paste previously generated links for quick config parsing)...',
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
    invalidShortUrl: 'لینک کوتاه نامعتبر',
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
    urlPlaceholder: 'لینک‌های اشتراک خود را اینجا وارد کنید (برای تجزیه سریع پیکربندی، لینک‌های تولید شده قبلی را جایگذاری کنید)...',
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
    UASettings: 'UserAgent سفارشی',
    UAtip: 'به طور پیش‌فرض از curl/7.74.0 استفاده می‌کند'
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
    pageDescription: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    pageKeywords: 'ссылка подписки,преобразование,Xray,SingBox,Clash,Surge',
    pageTitle: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    ogTitle: 'Sublink Worker - инструмент для преобразования ссылок подписки',
    ogDescription: 'Мощный инструмент для преобразования ссылок подписки, поддерживающий различные форматы клиентов',
    shareUrls: 'Поделиться ссылками',
    urlPlaceholder: 'Введите здесь ваши ссылки (вставьте ранее созданные ссылки для быстрого разбора конфигурации)...',
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
