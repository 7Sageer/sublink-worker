const PATH_LENGTH = 7;
const FNV_32_OFFSET_BASIS = 0x811c9dc5;
const FNV_32_PRIME = 0x01000193;

// 自定义的字符串前缀检查函数
export function checkStartsWith(str, prefix) {
	if (str === undefined || str === null || prefix === undefined || prefix === null) {
		return false;
	}
	str = String(str);
	prefix = String(prefix);
	return str.slice(0, prefix.length) === prefix;
}


// Base64 编码函数
export function encodeBase64(input) {
	const encoder = new TextEncoder();
	const utf8Array = encoder.encode(input);
	let binaryString = '';
	for (const byte of utf8Array) {
		binaryString += String.fromCharCode(byte);
	}
	return base64FromBinary(binaryString);
}

// Base64 解码函数
export function decodeBase64(input) {
	const binaryString = base64ToBinary(input);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	const decoder = new TextDecoder();
	return decoder.decode(bytes);
}

// 将二进制字符串转换为 Base64（编码）
export function base64FromBinary(binaryString) {
	const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	let base64String = '';
	let padding = '';

	const remainder = binaryString.length % 3;
	if (remainder > 0) {
		padding = '='.repeat(3 - remainder);
		binaryString += '\0'.repeat(3 - remainder);
	}

	for (let i = 0; i < binaryString.length; i += 3) {
		const bytes = [
			binaryString.charCodeAt(i),
			binaryString.charCodeAt(i + 1),
			binaryString.charCodeAt(i + 2)
		];
		const base64Index1 = bytes[0] >> 2;
		const base64Index2 = ((bytes[0] & 3) << 4) | (bytes[1] >> 4);
		const base64Index3 = ((bytes[1] & 15) << 2) | (bytes[2] >> 6);
		const base64Index4 = bytes[2] & 63;

		base64String += base64Chars[base64Index1] +
			base64Chars[base64Index2] +
			base64Chars[base64Index3] +
			base64Chars[base64Index4];
	}

	return base64String.slice(0, base64String.length - padding.length) + padding;
}

// 将 Base64 转换为二进制字符串（解码）
export function base64ToBinary(base64String) {
	const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	let binaryString = '';
	base64String = base64String.replace(/=+$/, ''); // 去掉末尾的 '='

	for (let i = 0; i < base64String.length; i += 4) {
		const bytes = [
			base64Chars.indexOf(base64String[i]),
			base64Chars.indexOf(base64String[i + 1]),
			base64Chars.indexOf(base64String[i + 2]),
			base64Chars.indexOf(base64String[i + 3])
		];
		const byte1 = (bytes[0] << 2) | (bytes[1] >> 4);
		const byte2 = ((bytes[1] & 15) << 4) | (bytes[2] >> 2);
		const byte3 = ((bytes[2] & 3) << 6) | bytes[3];

		if (bytes[1] !== -1) binaryString += String.fromCharCode(byte1);
		if (bytes[2] !== -1) binaryString += String.fromCharCode(byte2);
		if (bytes[3] !== -1) binaryString += String.fromCharCode(byte3);
	}

	return binaryString;
}

export function tryDecodeSubscriptionLines(input, { decodeUriComponent = false } = {}) {
	if (typeof input !== 'string') {
		return input;
	}

	const trimmed = input.trim();
	if (trimmed === '') {
		return trimmed;
	}

	const splitIfMultiple = (value) => {
		if (typeof value !== 'string') {
			return value;
		}

		const normalized = value.replace(/\r\n/g, '\n');
		const segments = normalized
			.split('\n')
			.map(segment => segment.trim())
			.filter(segment => segment !== '');

		if (segments.length > 1 && segments.some(segment => segment.includes('://'))) {
			return segments;
		}

		return normalized.trim();
	};

	const directResult = splitIfMultiple(trimmed);
	if (Array.isArray(directResult)) {
		return directResult;
	}
	if (typeof directResult === 'string' && directResult.includes('://')) {
		return directResult;
	}

	try {
		let decoded = decodeBase64(trimmed);
		if (decodeUriComponent && decoded.includes('%')) {
			const hasProtocolScheme = decoded.includes('://');
			if (!hasProtocolScheme) {
				try {
					decoded = decodeURIComponent(decoded);
				} catch (_) {
					// ignore URI decode errors and fall back to the decoded string
				}
			}
		}

		const decodedResult = splitIfMultiple(decoded);
		if (Array.isArray(decodedResult)) {
			return decodedResult;
		}
		if (typeof decodedResult === 'string' && decodedResult.includes('://')) {
			return decodedResult;
		}
	} catch (_) {
		// ignore decoding errors and return the original trimmed input
	}

	return trimmed;
}

export function groupProxiesByCountry(proxies, { getName } = {}) {
	const extractor = typeof getName === 'function'
		? getName
		: (proxy) => {
			if (proxy == null) return undefined;
			if (typeof proxy === 'string') {
				return proxy;
			}
			if (typeof proxy === 'object') {
				return proxy.name ?? proxy.tag ?? proxy.id ?? proxy.ps;
			}
			return undefined;
		};

	const normalizeName = (value) => {
		if (typeof value !== 'string') {
			return undefined;
		}
		const trimmed = value.trim();
		if (!trimmed) {
			return undefined;
		}
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex > -1) {
			const beforeEq = trimmed.slice(0, eqIndex).trim();
			if (beforeEq) {
				return beforeEq;
			}
		}
		return trimmed;
	};

	const grouped = {};
	if (!Array.isArray(proxies) || proxies.length === 0) {
		return grouped;
	}

	proxies.forEach(proxy => {
		const rawName = extractor(proxy);
		const proxyName = normalizeName(rawName);
		if (!proxyName) {
			return;
		}
		const countryInfo = parseCountryFromNodeName(proxyName);
		if (!countryInfo) {
			return;
		}
		const { name } = countryInfo;
		if (!grouped[name]) {
			grouped[name] = { ...countryInfo, proxies: [] };
		}
		grouped[name].proxies.push(proxyName);
	});

	return grouped;
}

export function addCountryFlagToNodeName(nodeName) {
	if (typeof nodeName !== 'string') {
		return nodeName;
	}

	if (/[\u{1F1E6}-\u{1F1FF}]{2}/u.test(nodeName)) {
		return nodeName;
	}

	const countryInfo = parseCountryFromNodeName(nodeName);
	if (!countryInfo?.emoji) {
		return nodeName;
	}

	return `${countryInfo.emoji} ${nodeName}`;
}

export function createStableProviderName(url) {
	if (typeof url !== 'string' || url.trim() === '') {
		throw new Error('Provider URL must be a non-empty string');
	}

	const normalizedUrl = url.trim();
	let hash = FNV_32_OFFSET_BASIS;
	for (let i = 0; i < normalizedUrl.length; i++) {
		hash ^= normalizedUrl.charCodeAt(i);
		hash = Math.imul(hash, FNV_32_PRIME);
	}

	return `_auto_provider_${(hash >>> 0).toString(36)}`;
}

export function deepCopy(obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map(item => deepCopy(item));
	}
	const newObj = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			newObj[key] = deepCopy(obj[key]);
		}
	}
	return newObj;
}

export function generateWebPath(length = PATH_LENGTH) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return result
}

export function parseServerInfo(serverInfo) {
	if (!serverInfo || typeof serverInfo !== 'string') {
		return { host: null, port: null };
	}
	let host, port;
	if (serverInfo.startsWith('[')) {
		const closeBracketIndex = serverInfo.indexOf(']');
		host = serverInfo.slice(1, closeBracketIndex);
		port = serverInfo.slice(closeBracketIndex + 2); // +2 to skip ']:'
	} else {
		const lastColonIndex = serverInfo.lastIndexOf(':');
		host = serverInfo.slice(0, lastColonIndex);
		port = serverInfo.slice(lastColonIndex + 1);
	}
	return { host, port: parseInt(port) };
}

export function parseUrlParams(url) {
	const [, rest] = url.split('://');
	const [addressPart, ...remainingParts] = rest.split('?');
	const paramsPart = remainingParts.join('?');

	const [paramsOnly, ...fragmentParts] = paramsPart.split('#');
	const searchParams = new URLSearchParams(paramsOnly);
	const params = Object.fromEntries(searchParams.entries());

	let name = fragmentParts.length > 0 ? fragmentParts.join('#') : '';
	try {
		name = decodeURIComponent(name);
	} catch (error) { };

	return { addressPart, params, name };
}

export function createTlsConfig(params) {
	let tls = { enabled: false };
	if (params.security && params.security !== 'none') {
		tls = {
			enabled: true,
			server_name: params.sni || params.host,
			insecure: !!params?.allowInsecure || !!params?.insecure || !!params?.allow_insecure,
			// utls: {
			//   enabled: true,
			//   fingerprint: "chrome"
			// },
		};
		if (params.security === 'reality') {
			tls.reality = {
				enabled: true,
				public_key: params.pbk,
				short_id: params.sid,
			};
		}
	}
	return tls;
}

export function createTransportConfig(params) {
	return {
		type: params.type,
		path: params.path ?? undefined,
		...(params.host && { 'headers': { 'host': params.host } }),
		...(params.type === 'grpc' && {
			service_name: params.serviceName ?? undefined,
		})
	};
}

// Parse boolean value from various formats
export function parseBool(value, fallback = undefined) {
	if (value === undefined || value === null) return fallback;
	if (typeof value === 'boolean') return value;
	const lowered = String(value).toLowerCase();
	if (lowered === 'true' || lowered === '1') return true;
	if (lowered === 'false' || lowered === '0') return false;
	return fallback;
}

// Parse number value safely
export function parseMaybeNumber(value) {
	if (value === undefined || value === null) return undefined;
	const num = Number(value);
	return Number.isNaN(num) ? undefined : num;
}

// Parse comma-separated string to array
export function parseArray(value) {
	if (!value) return undefined;
	if (Array.isArray(value)) return value;
	return String(value)
		.split(',')
		.map(entry => entry.trim())
		.filter(entry => entry.length > 0);
}

const ISO_REGION_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT
MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM
US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`.trim().split(/\s+/);

const COUNTRY_OVERRIDES = {
	HK: { name: 'Hong Kong', names: { 'zh-CN': '香港' }, aliases: ['香港', 'Hong Kong', 'HK'] },
	TW: { name: 'Taiwan', names: { 'zh-CN': '台湾' }, aliases: ['台湾', '台灣', 'Taiwan', 'TW'] },
	JP: { name: 'Japan', names: { 'zh-CN': '日本' }, aliases: ['日本', 'Japan', 'JP'] },
	KR: { name: 'Korea', names: { 'zh-CN': '韩国' }, aliases: ['韩国', '韓國', 'Korea', 'South Korea', 'KR'] },
	SG: { name: 'Singapore', names: { 'zh-CN': '新加坡' }, aliases: ['新加坡', 'Singapore', 'SG'] },
	US: { name: 'United States', names: { 'zh-CN': '美国' }, aliases: ['美国', '美國', 'United States', 'United States of America', 'USA', 'US'] },
	GB: { name: 'United Kingdom', names: { 'zh-CN': '英国' }, aliases: ['英国', '英國', 'United Kingdom', 'Great Britain', 'UK', 'GB'] },
	DE: { name: 'Germany', names: { 'zh-CN': '德国' }, aliases: ['德国', '德國', 'Germany'] },
	FR: { name: 'France', names: { 'zh-CN': '法国' }, aliases: ['法国', '法國', 'France'] },
	RU: { name: 'Russia', names: { 'zh-CN': '俄罗斯' }, aliases: ['俄罗斯', '俄羅斯', 'Russia', 'Russian Federation'] },
	CA: { name: 'Canada', names: { 'zh-CN': '加拿大' }, aliases: ['加拿大', 'Canada'] },
	AU: { name: 'Australia', names: { 'zh-CN': '澳大利亚' }, aliases: ['澳大利亚', '澳洲', 'Australia'] },
	IN: { name: 'India', names: { 'zh-CN': '印度' }, aliases: ['印度', 'India'] },
	BR: { name: 'Brazil', names: { 'zh-CN': '巴西' }, aliases: ['巴西', 'Brazil'] },
	ZA: { name: 'South Africa', names: { 'zh-CN': '南非' }, aliases: ['南非', 'South Africa'] },
	AR: { name: 'Argentina', names: { 'zh-CN': '阿根廷' }, aliases: ['阿根廷', 'Argentina'] },
	TR: { name: 'Turkey', names: { 'zh-CN': '土耳其' }, aliases: ['土耳其', 'Turkey', 'Türkiye'] },
	NL: { name: 'Netherlands', names: { 'zh-CN': '荷兰' }, aliases: ['荷兰', '荷蘭', 'Netherlands', 'Holland'] },
	CH: { name: 'Switzerland', names: { 'zh-CN': '瑞士' }, aliases: ['瑞士', 'Switzerland'] },
	SE: { name: 'Sweden', names: { 'zh-CN': '瑞典' }, aliases: ['瑞典', 'Sweden'] },
	IT: { name: 'Italy', names: { 'zh-CN': '意大利' }, aliases: ['意大利', 'Italy'] },
	ES: { name: 'Spain', names: { 'zh-CN': '西班牙' }, aliases: ['西班牙', 'Spain'] },
	IE: { name: 'Ireland', names: { 'zh-CN': '爱尔兰' }, aliases: ['爱尔兰', '愛爾蘭', 'Ireland'] },
	MY: { name: 'Malaysia', names: { 'zh-CN': '马来西亚' }, aliases: ['马来西亚', '馬來西亞', 'Malaysia'] },
	TH: { name: 'Thailand', names: { 'zh-CN': '泰国' }, aliases: ['泰国', '泰國', 'Thailand'] },
	VN: { name: 'Vietnam', names: { 'zh-CN': '越南' }, aliases: ['越南', 'Vietnam', 'Viet Nam'] },
	PH: { name: 'Philippines', names: { 'zh-CN': '菲律宾' }, aliases: ['菲律宾', '菲律賓', 'Philippines'] },
	ID: { name: 'Indonesia', names: { 'zh-CN': '印度尼西亚' }, aliases: ['印度尼西亚', '印度尼西亞', 'Indonesia'] },
	NZ: { name: 'New Zealand', names: { 'zh-CN': '新西兰' }, aliases: ['新西兰', '紐西蘭', 'New Zealand'] },
	AE: { name: 'United Arab Emirates', names: { 'zh-CN': '阿联酋' }, aliases: ['阿联酋', '阿聯酋', 'United Arab Emirates', 'UAE'] },
	MO: { name: 'Macao', names: { 'zh-CN': '澳门' }, aliases: ['澳门', '澳門', 'Macao', 'Macau'] },
	CN: { name: 'China', names: { 'zh-CN': '中国' }, aliases: ['中国', '中國', 'China', 'CN'] },
	CZ: { aliases: ['捷克', 'Czechia', 'Czech Republic'] },
	LA: { aliases: ['老挝', '寮國', 'Laos', 'Lao'] },
	MM: { aliases: ['缅甸', '緬甸', 'Myanmar', 'Burma'] },
};

const DISPLAY_NAME_CACHE = new Map();
let COUNTRY_ALIAS_ENTRIES;
let COUNTRY_CODE_ENTRIES;

function uniqueStrings(values) {
	const seen = new Set();
	return values
		.filter(value => typeof value === 'string' && value.trim().length > 0)
		.map(value => value.trim())
		.filter(value => {
			const key = value.toLowerCase();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
}

function getRegionDisplayName(code, locale) {
	if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
		return null;
	}

	const cacheKey = locale;
	let displayNames = DISPLAY_NAME_CACHE.get(cacheKey);
	if (!displayNames) {
		try {
			displayNames = new Intl.DisplayNames([locale], { type: 'region' });
			DISPLAY_NAME_CACHE.set(cacheKey, displayNames);
		} catch {
			return null;
		}
	}

	try {
		return displayNames.of(code) || null;
	} catch {
		return null;
	}
}

function resolveCountryDisplayLocale(lang) {
	const normalized = String(lang || '').replace('_', '-');
	if (checkStartsWith(normalized, 'zh')) return 'zh-CN';
	if (checkStartsWith(normalized, 'fa')) return 'fa';
	if (checkStartsWith(normalized, 'ru')) return 'ru';
	return 'en-US';
}

export function countryCodeToFlagEmoji(code) {
	const normalized = String(code || '').toUpperCase();
	if (!/^[A-Z]{2}$/.test(normalized)) return '';
	return [...normalized]
		.map(char => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65))
		.join('');
}

function createCountryInfo(code) {
	const generatedNames = {
		'en-US': getRegionDisplayName(code, 'en-US') || code,
		'zh-CN': getRegionDisplayName(code, 'zh-CN') || getRegionDisplayName(code, 'en-US') || code,
		fa: getRegionDisplayName(code, 'fa') || getRegionDisplayName(code, 'en-US') || code,
		ru: getRegionDisplayName(code, 'ru') || getRegionDisplayName(code, 'en-US') || code
	};
	const override = COUNTRY_OVERRIDES[code] || {};
	const names = {
		...generatedNames,
		...(override.names || {})
	};

	return {
		code,
		name: override.name || names['en-US'],
		names,
		emoji: override.emoji || countryCodeToFlagEmoji(code),
		aliases: uniqueStrings([
			...(override.aliases || []),
			...Object.values(generatedNames),
			...Object.values(names)
		])
	};
}

export const COUNTRY_DATA = Object.fromEntries(
	ISO_REGION_CODES.map(code => [code, createCountryInfo(code)])
);

export function getCountryDisplayName(countryInfo, lang = 'en-US') {
	const country = typeof countryInfo === 'string' ? COUNTRY_DATA[countryInfo.toUpperCase()] : countryInfo;
	if (!country) return '';
	const locale = resolveCountryDisplayLocale(lang);
	return country.names?.[locale] || country.name || country.code || '';
}

export function formatCountryGroupName(countryInfo, lang = 'en-US') {
	if (!countryInfo) return '';
	const emoji = countryInfo.emoji || countryCodeToFlagEmoji(countryInfo.code);
	const name = getCountryDisplayName(countryInfo, lang);
	return `${emoji} ${name}`.trim();
}

function buildAliasPattern(alias, escaped) {
	if (/^[A-Za-z][A-Za-z\s.'()-]*[A-Za-z]$/.test(alias) || /^[A-Za-z]{2,3}$/.test(alias)) {
		return `\\b${escaped}\\b`;
	}
	return escaped;
}

function getCountryAliasEntries() {
	if (!COUNTRY_ALIAS_ENTRIES) {
		COUNTRY_ALIAS_ENTRIES = Object.values(COUNTRY_DATA)
			.flatMap(country => country.aliases.map(alias => ({
				country,
				alias,
				regex: new RegExp(buildAliasPattern(alias, alias.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')), 'iu')
			})))
			.sort((a, b) => b.alias.length - a.alias.length);
	}
	return COUNTRY_ALIAS_ENTRIES;
}

function getCountryCodeEntries() {
	if (!COUNTRY_CODE_ENTRIES) {
		COUNTRY_CODE_ENTRIES = Object.values(COUNTRY_DATA).map(country => ({
			country,
			regex: new RegExp(`(^|[^A-Za-z0-9])${country.code}(?=$|[^A-Za-z0-9])`, 'u')
		}));
	}
	return COUNTRY_CODE_ENTRIES;
}

export function parseCountryFromNodeName(nodeName) {
	if (typeof nodeName !== 'string' || nodeName.trim().length === 0) {
		return null;
	}

	for (const entry of getCountryAliasEntries()) {
		if (entry.regex.test(nodeName)) {
			return { code: entry.country.code, ...entry.country };
		}
	}

	for (const entry of getCountryCodeEntries()) {
		if (entry.regex.test(nodeName)) {
			return { code: entry.country.code, ...entry.country };
		}
	}

	return null;
}
