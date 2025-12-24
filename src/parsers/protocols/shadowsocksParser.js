import { base64ToBinary } from '../../utils.js';

function parseServer(serverPart) {
    const match = serverPart.match(/\[([^\]]+)\]:(\d+)/);
    if (match) {
        return [match[1], match[2]];
    }
    return serverPart.split(':');
}

/**
 * Parse plugin string from URL query parameter
 * Format: "simple-obfs;obfs=http;obfs-host=example.com" or "v2ray-plugin;mode=websocket;host=example.com"
 * @param {string} pluginStr - The plugin parameter value (URL decoded)
 * @returns {{plugin: string, plugin_opts: object}|null} - Parsed plugin info or null
 */
function parsePluginString(pluginStr) {
    if (!pluginStr) return null;

    const parts = pluginStr.split(';');
    const pluginName = parts[0];

    if (!pluginName) return null;

    const opts = {};
    for (let i = 1; i < parts.length; i++) {
        const eqIndex = parts[i].indexOf('=');
        if (eqIndex === -1) {
            // Boolean flag without value (e.g., "tls")
            const key = parts[i].trim();
            if (key) {
                opts[key] = true;
            }
            continue;
        }
        const key = parts[i].substring(0, eqIndex);
        const value = parts[i].substring(eqIndex + 1);
        if (key) {
            // Map SIP003 parameter names to Clash plugin-opts format
            // simple-obfs parameters: obfs -> mode, obfs-host -> host
            // v2ray-plugin parameters: mode, host, path, tls, etc.
            if (key === 'obfs') {
                opts.mode = value;
            } else if (key === 'obfs-host') {
                opts.host = value;
            } else if (key === 'obfs-uri') {
                opts.path = value;
            } else {
                opts[key] = value;
            }
        }
    }

    // Normalize plugin name: simple-obfs -> obfs (Clash uses 'obfs')
    const normalizedPlugin = pluginName === 'simple-obfs' ? 'obfs' : pluginName;

    return {
        plugin: normalizedPlugin,
        plugin_opts: Object.keys(opts).length > 0 ? opts : undefined
    };
}

function createConfig(tag, server, server_port, method, password, pluginInfo) {
    const config = {
        tag: tag || 'Shadowsocks',
        type: 'shadowsocks',
        server,
        server_port: parseInt(server_port),
        method,
        password,
        network: 'tcp',
        tcp_fast_open: false
    };

    // Add plugin fields if present
    if (pluginInfo) {
        config.plugin = pluginInfo.plugin;
        if (pluginInfo.plugin_opts) {
            config.plugin_opts = pluginInfo.plugin_opts;
        }
    }

    return config;
}

export function parseShadowsocks(url) {
    let parts = url.replace('ss://', '').split('#');
    let mainPart = parts[0];
    let tag = parts[1];
    if (tag && tag.includes('%')) {
        tag = decodeURIComponent(tag);
    }

    // Extract query parameters (for plugin support)
    let queryString = '';
    const queryIndex = mainPart.indexOf('?');
    if (queryIndex !== -1) {
        queryString = mainPart.substring(queryIndex + 1);
        mainPart = mainPart.substring(0, queryIndex);
    }

    // Parse plugin from query string
    let pluginInfo = null;
    if (queryString) {
        const params = new URLSearchParams(queryString);
        const pluginParam = params.get('plugin');
        if (pluginParam) {
            pluginInfo = parsePluginString(pluginParam);
        }
    }

    try {
        let [base64, serverPart] = mainPart.split('@');
        if (!serverPart) {
            const decodedLegacy = base64ToBinary(mainPart);
            const [methodAndPass, serverInfo] = decodedLegacy.split('@');
            const [method, password] = methodAndPass.split(':');
            const [server, server_port] = parseServer(serverInfo);
            return createConfig(tag, server, server_port, method, password, pluginInfo);
        }

        let decodedParts = base64ToBinary(decodeURIComponent(base64)).split(':');
        let method = decodedParts[0];
        let password = decodedParts.slice(1).join(':');
        let [server, server_port] = parseServer(serverPart);

        return createConfig(tag, server, server_port, method, password, pluginInfo);
    } catch (e) {
        console.error('Failed to parse shadowsocks URL:', e);
        return null;
    }
}
