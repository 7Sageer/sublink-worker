const PATH_LENGTH = 7;

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
export function DeepCopy(obj) {
	if (obj === null || typeof obj !== 'object') {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map(item => DeepCopy(item));
	}
	const newObj = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			newObj[key] = DeepCopy(obj[key]);
		}
	}
	return newObj;
}

export function GenerateWebPath(length = PATH_LENGTH) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return result
}

export function parseServerInfo(serverInfo) {
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
	if (params.security != 'none') {
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
		...(params.host && {'headers': {'host': params.host}}),
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

export function parseCountryFromNodeName(nodeName) {
	const countryMap = {
		'香港': 'HK', 'HK': 'HK', 'Hong Kong': 'HK', '🇭🇰': 'HK',
		'台湾': 'TW', 'TW': 'TW', 'Taiwan': 'TW', '🇨🇳': 'TW',
		'日本': 'JP', 'JP': 'JP', 'Japan': 'JP', '🇯🇵': 'JP',
		'韩国': 'KR', 'KR': 'KR', 'Korea': 'KR', '🇰🇷': 'KR',
		'新加坡': 'SG', 'SG': 'SG', 'Singapore': 'SG', '🇸🇬': 'SG',
		'美国': 'US', 'US': 'US', 'United States': 'US', '🇺🇸': 'US',
		'英国': 'GB', 'GB': 'GB', 'United Kingdom': 'GB', '🇬🇧': 'GB',
		'德国': 'DE', 'DE': 'DE', 'Germany': 'DE', '🇩🇪': 'DE',
		'法国': 'FR', 'FR': 'FR', 'France': 'FR', '🇫🇷': 'FR',
		'俄罗斯': 'RU', 'RU': 'RU', 'Russia': 'RU', '🇷🇺': 'RU',
		'加拿大': 'CA', 'CA': 'CA', 'Canada': 'CA', '🇨🇦': 'CA',
		'澳大利亚': 'AU', 'AU': 'AU', 'Australia': 'AU', '🇦🇺': 'AU',
		'印度': 'IN', 'IN': 'IN', 'India': 'IN', '🇮🇳': 'IN',
		'巴西': 'BR', 'BR': 'BR', 'Brazil': 'BR', '🇧🇷': 'BR',
		'南非': 'ZA', 'ZA': 'ZA', 'South Africa': 'ZA', '🇿🇦': 'ZA',
		'阿根廷': 'AR', 'AR': 'AR', 'Argentina': 'AR', '🇦🇷': 'AR',
		'土耳其': 'TR', 'TR': 'TR', 'Turkey': 'TR', '🇹🇷': 'TR',
		'荷兰': 'NL', 'NL': 'NL', 'Netherlands': 'NL', '🇳🇱': 'NL',
		'瑞士': 'CH', 'CH': 'CH', 'Switzerland': 'CH', '🇨🇭': 'CH',
		'瑞典': 'SE', 'SE': 'SE', 'Sweden': 'SE', '🇸🇪': 'SE',
		'意大利': 'IT', 'IT': 'IT', 'Italy': 'IT', '🇮🇹': 'IT',
		'西班牙': 'ES', 'ES': 'ES', 'Spain': 'ES', '🇪🇸': 'ES',
		'爱尔兰': 'IE', 'IE': 'IE', 'Ireland': 'IE', '🇮🇪': 'IE',
		'马来西亚': 'MY', 'MY': 'MY', 'Malaysia': 'MY', '🇲🇾': 'MY',
		'泰国': 'TH', 'TH': 'TH', 'Thailand': 'TH', '🇹🇭': 'TH',
		'越南': 'VN', 'VN': 'VN', 'Vietnam': 'VN', '🇻🇳': 'VN',
		'菲律宾': 'PH', 'PH': 'PH', 'Philippines': 'PH', '🇵🇭': 'PH',
		'印度尼西亚': 'ID', 'ID': 'ID', 'Indonesia': 'ID', '🇮🇩': 'ID',
		'新西兰': 'NZ', 'NZ': 'NZ', 'New Zealand': 'NZ', '🇳🇿': 'NZ',
		'阿联酋': 'AE', 'AE': 'AE', 'United Arab Emirates': 'AE', '🇦🇪': 'AE',
	};

	const countryFullNameMap = {
		'HK': 'Hong Kong',
		'TW': 'Taiwan',
		'JP': 'Japan',
		'KR': 'Korea',
		'SG': 'Singapore',
		'US': 'United States',
		'GB': 'United Kingdom',
		'DE': 'Germany',
		'FR': 'France',
		'RU': 'Russia',
		'CA': 'Canada',
		'AU': 'Australia',
		'IN': 'India',
		'BR': 'Brazil',
		'ZA': 'South Africa',
		'AR': 'Argentina',
		'TR': 'Turkey',
		'NL': 'Netherlands',
		'CH': 'Switzerland',
		'SE': 'Sweden',
		'IT': 'Italy',
		'ES': 'Spain',
		'IE': 'Ireland',
		'MY': 'Malaysia',
		'TH': 'Thailand',
		'VN': 'Vietnam',
		'PH': 'Philippines',
		'ID': 'Indonesia',
		'NZ': 'New Zealand',
		'AE': 'United Arab Emirates',
	};

	const patterns = Object.keys(countryMap);
	const regex = new RegExp(patterns.map(p => p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'i');
	const match = nodeName.match(regex);

	if (match) {
		const matchedKey = Object.keys(countryMap).find(key => new RegExp(`^${key}$`, 'i').test(match[0]));
		if (matchedKey) {
			const countryCode = countryMap[matchedKey];
			return countryFullNameMap[countryCode] || null;
		}
	}

	return null;
}
