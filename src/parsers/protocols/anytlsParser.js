import {
	parseServerInfo,
	parseUrlParams,
	parseArray,
	parseBool,
} from "../../utils.js";

export function parseAnyTls(url) {
	const { addressPart, params, name } = parseUrlParams(url);
	const [password, serverInfo] = addressPart.split("@");
	const { host, port } = parseServerInfo(serverInfo);

	const alpn = parseArray(params.alpn);
	const insecure = parseBool(
		params["skip-cert-verify"] ?? params.insecure ?? params.allowInsecure,
		true,
	);

	const tls = {
		enabled: true,
		server_name: params.sni,
		insecure: insecure,
		alpn: alpn,
	};

	if (params["client-fingerprint"]) {
		tls.utls = {
			enabled: true,
			fingerprint: params["client-fingerprint"],
		};
	}

	return {
		tag: name,
		type: "anytls",
		server: host,
		server_port: port,
		password: password,
		tls: tls,
		udp: parseBool(params.udp, false),
		sni: params.sni,
		alpn: alpn.length ? alpn : undefined,
		"idle-session-check-interval": params["idle-session-check-interval"],
		"idle-session-timeout": params["idle-session-timeout"],
		"min-idle-session": params["min-idle-session"],
	};
}
