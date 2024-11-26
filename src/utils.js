const PATH_LENGTH = 7;

export function decodeBase64(str) {
	const binString = atob(str);
	const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
	return new TextDecoder().decode(bytes);
}
export function encodeBase64(str) {
	return btoa(str);
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
  
	const name = fragmentParts.length > 0 ? decodeURIComponent(fragmentParts.join('#')) : '';
  
	return { addressPart, params, name };
  }
  
  export function createTlsConfig(params) {
	let tls = { enabled: false };
	if (params.security === 'xtls' || params.security === 'tls' || params.security === 'reality') {
	  tls = {
		enabled: true,
		server_name: params.sni,
		insecure: false,
		utls: {
		  enabled: true,
		  fingerprint: "chrome"
		},
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
	  service_name: params.serviceName ?? undefined,
	};
  }