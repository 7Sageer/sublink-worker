import { parseServerInfo, parseUrlParams, createTlsConfig, createTransportConfig } from '../../utils.js';

export function parseTrojan(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [password, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);

    const parsedURL = parseServerInfo(addressPart);
    const tls = createTlsConfig(params);
    const transport = params.type !== 'tcp' ? createTransportConfig(params) : undefined;
    return {
        type: 'trojan',
        tag: name,
        server: host,
        server_port: port,
        password: decodeURIComponent(password) || parsedURL.username,
        network: 'tcp',
        tcp_fast_open: false,
        tls,
        transport,
        flow: params.flow ?? undefined
    };
}
