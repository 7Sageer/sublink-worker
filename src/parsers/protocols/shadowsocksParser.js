import { base64ToBinary } from '../../utils.js';

function parseServer(serverPart) {
    const match = serverPart.match(/\[([^\]]+)\]:(\d+)/);
    if (match) {
        return [match[1], match[2]];
    }
    return serverPart.split(':');
}

function createConfig(tag, server, server_port, method, password) {
    return {
        tag: tag || 'Shadowsocks',
        type: 'shadowsocks',
        server,
        server_port: parseInt(server_port),
        method,
        password,
        network: 'tcp',
        tcp_fast_open: false
    };
}

export function parseShadowsocks(url) {
    let parts = url.replace('ss://', '').split('#');
    let mainPart = parts[0];
    let tag = parts[1];
    if (tag && tag.includes('%')) {
        tag = decodeURIComponent(tag);
    }

    try {
        let [base64, serverPart] = mainPart.split('@');
        if (!serverPart) {
            const decodedLegacy = base64ToBinary(mainPart);
            const [methodAndPass, serverInfo] = decodedLegacy.split('@');
            const [method, password] = methodAndPass.split(':');
            const [server, server_port] = parseServer(serverInfo);
            return createConfig(tag, server, server_port, method, password);
        }

        let decodedParts = base64ToBinary(decodeURIComponent(base64)).split(':');
        let method = decodedParts[0];
        let password = decodedParts.slice(1).join(':');
        let [server, server_port] = parseServer(serverPart);

        return createConfig(tag, server, server_port, method, password);
    } catch (e) {
        console.error('Failed to parse shadowsocks URL:', e);
        return null;
    }
}
