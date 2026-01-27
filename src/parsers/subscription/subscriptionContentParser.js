import yaml from 'js-yaml';
import { deepCopy } from '../../utils.js';
import { convertYamlProxyToObject } from '../convertYamlProxyToObject.js';
import { convertSurgeProxyToObject } from '../convertSurgeProxyToObject.js';
import { convertSurgeIniToJson } from '../../utils/surgeConfigParser.js';
import { InvalidPayloadError } from '../../services/errors.js';

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKind(kind) {
    if (!kind) return '';
    const k = String(kind).trim().toLowerCase();
    if (k === 'ss') return 'shadowsocks';
    if (k === 'hy2') return 'hysteria2';
    return k;
}

function normalizeTagsForNode(node) {
    if (!node) return [];
    if (Array.isArray(node.tags)) return node.tags.filter(Boolean).map(v => `${v}`.trim()).filter(Boolean);
    if (typeof node.tag === 'string' && node.tag.trim()) return [node.tag.trim()];
    if (typeof node.name === 'string' && node.name.trim()) return [node.name.trim()];
    return [];
}

function formatNodeFieldError(index, field, reason) {
    const prefix = typeof index === 'number' ? `nodes[${index}].${field}` : field;
    return `${prefix}: ${reason}`;
}

function normalizeTls(tls) {
    if (!isPlainObject(tls)) return undefined;
    const copy = { ...tls };
    if (copy.sni && !copy.server_name) copy.server_name = copy.sni;
    if (copy.server_name && !copy.sni) copy.sni = copy.server_name;
    return copy;
}

function normalizeInputNodeToProxy(node, index) {
    if (!isPlainObject(node)) {
        throw new InvalidPayloadError(formatNodeFieldError(index, 'node', 'must be an object'));
    }

    const kind = normalizeKind(node.kind ?? node.type);
    if (!kind) {
        throw new InvalidPayloadError(formatNodeFieldError(index, 'kind', 'is required'));
    }

    const server = (node.host ?? node.server ?? node.address ?? '').toString().trim();
    if (!server) {
        throw new InvalidPayloadError(formatNodeFieldError(index, 'host', 'is required'));
    }

    const portValue = node.port ?? node.server_port;
    const port = Number(portValue);
    if (!Number.isFinite(port) || port <= 0) {
        throw new InvalidPayloadError(formatNodeFieldError(index, 'port', 'must be a positive number'));
    }

    const tags = normalizeTagsForNode(node);
    if (!Array.isArray(tags) || tags.length === 0) {
        throw new InvalidPayloadError(formatNodeFieldError(index, 'tag', 'tag or tags is required'));
    }

    const common = {
        tag: tags[0],
        type: kind,
        server,
        server_port: port,
        ...(node.udp !== undefined ? { udp: node.udp } : {}),
        ...(node.network ? { network: node.network } : {}),
        ...(node.transport ? { transport: node.transport } : {}),
        ...(node.tls ? { tls: normalizeTls(node.tls) } : {}),
    };

    switch (kind) {
        case 'vmess': {
            const uuid = node.uuid ?? node.auth?.uuid;
            if (!uuid) throw new InvalidPayloadError(formatNodeFieldError(index, 'uuid', 'is required'));
            return {
                ...common,
                type: 'vmess',
                uuid,
                alter_id: node.alter_id ?? node.alterId ?? node.auth?.alter_id ?? node.auth?.alterId,
                security: node.security ?? node.method ?? node.auth?.method,
                ...(node.packet_encoding ? { packet_encoding: node.packet_encoding } : {}),
                ...(node.alpn ? { alpn: node.alpn } : {}),
            };
        }
        case 'vless': {
            const uuid = node.uuid ?? node.auth?.uuid;
            if (!uuid) throw new InvalidPayloadError(formatNodeFieldError(index, 'uuid', 'is required'));
            return {
                ...common,
                type: 'vless',
                uuid,
                ...(node.flow ? { flow: node.flow } : {}),
                ...(node.packet_encoding || node.packetEncoding ? { packet_encoding: node.packet_encoding ?? node.packetEncoding } : {}),
                ...(node.alpn ? { alpn: node.alpn } : {}),
            };
        }
        case 'trojan': {
            const password = node.password ?? node.auth?.password;
            if (!password) throw new InvalidPayloadError(formatNodeFieldError(index, 'password', 'is required'));
            return {
                ...common,
                type: 'trojan',
                password,
                ...(node.flow ? { flow: node.flow } : {}),
                ...(node.alpn ? { alpn: node.alpn } : {}),
            };
        }
        case 'shadowsocks': {
            const password = node.password ?? node.auth?.password;
            const method = node.method ?? node.cipher ?? node.auth?.method;
            if (!password) throw new InvalidPayloadError(formatNodeFieldError(index, 'password', 'is required'));
            if (!method) throw new InvalidPayloadError(formatNodeFieldError(index, 'method', 'is required'));
            return {
                ...common,
                type: 'shadowsocks',
                password,
                method,
                ...(node.plugin ? { plugin: node.plugin } : {}),
                ...(node.plugin_opts ? { plugin_opts: node.plugin_opts } : {}),
            };
        }
        case 'hysteria2': {
            const password = node.password ?? node.auth?.password;
            if (!password) throw new InvalidPayloadError(formatNodeFieldError(index, 'password', 'is required'));
            return {
                ...common,
                type: 'hysteria2',
                password,
                ...(node.obfs ? { obfs: node.obfs } : {}),
                ...(node.authPayload ?? node.auth ? { auth: node.authPayload ?? node.auth } : {}),
                ...(node.up ? { up: node.up } : {}),
                ...(node.down ? { down: node.down } : {}),
                ...(node.recv_window_conn ? { recv_window_conn: node.recv_window_conn } : {}),
                ...(node.ports ? { ports: node.ports } : {}),
                ...(node.hop_interval !== undefined ? { hop_interval: node.hop_interval } : {}),
                ...(node.fast_open !== undefined ? { fast_open: node.fast_open } : {}),
                ...(node.alpn ? { alpn: node.alpn } : {}),
            };
        }
        case 'tuic': {
            const uuid = node.uuid ?? node.auth?.uuid;
            const password = node.password ?? node.auth?.password;
            if (!uuid) throw new InvalidPayloadError(formatNodeFieldError(index, 'uuid', 'is required'));
            if (!password) throw new InvalidPayloadError(formatNodeFieldError(index, 'password', 'is required'));
            return {
                ...common,
                type: 'tuic',
                uuid,
                password,
                ...(node.congestion_control ? { congestion_control: node.congestion_control } : {}),
                ...(node.udp_relay_mode ? { udp_relay_mode: node.udp_relay_mode } : {}),
                ...(node.zero_rtt !== undefined ? { zero_rtt: node.zero_rtt } : {}),
                ...(node.reduce_rtt !== undefined ? { reduce_rtt: node.reduce_rtt } : {}),
                ...(node.fast_open !== undefined ? { fast_open: node.fast_open } : {}),
                ...(node.disable_sni !== undefined ? { disable_sni: node.disable_sni } : {}),
            };
        }
        case 'anytls': {
            const password = node.password ?? node.auth?.password;
            if (!password) throw new InvalidPayloadError(formatNodeFieldError(index, 'password', 'is required'));
            return {
                ...common,
                type: 'anytls',
                password,
                ...(node['idle-session-check-interval'] !== undefined ? { 'idle-session-check-interval': node['idle-session-check-interval'] } : {}),
                ...(node['idle-session-timeout'] !== undefined ? { 'idle-session-timeout': node['idle-session-timeout'] } : {}),
                ...(node['min-idle-session'] !== undefined ? { 'min-idle-session': node['min-idle-session'] } : {}),
            };
        }
        case 'http':
        case 'https':
            return {
                ...common,
                type: kind,
                ...(node.username ? { username: node.username } : {}),
                ...(node.password ? { password: node.password } : {}),
            };
        default:
            throw new InvalidPayloadError(formatNodeFieldError(index, 'kind', `unsupported kind: ${kind}`));
    }
}

function parseNormalizedInputObject(content) {
    let parsed;
    try {
        if (content.trim().startsWith('{')) {
            parsed = JSON.parse(content);
        } else {
            parsed = yaml.load(content);
        }
    } catch {
        return null;
    }

    if (!isPlainObject(parsed)) return null;
    if (!Object.prototype.hasOwnProperty.call(parsed, 'version') || !Object.prototype.hasOwnProperty.call(parsed, 'nodes')) {
        return null;
    }

    const version = parsed.version;
    if (typeof version !== 'string' || !version.trim()) {
        throw new InvalidPayloadError('version: must be a non-empty string');
    }

    const nodes = parsed.nodes;
    if (!Array.isArray(nodes)) {
        throw new InvalidPayloadError('nodes: must be an array');
    }
    if (nodes.length === 0) {
        throw new InvalidPayloadError('nodes: must not be empty');
    }
    if (nodes.length > 500) {
        throw new InvalidPayloadError('nodes: too many nodes (max 500)');
    }

    const proxies = nodes.map((node, index) => normalizeInputNodeToProxy(node, index));
    return { type: 'normalizedInput', proxies, config: null };
}

/**
 * Non-proxy outbound types in Sing-Box that should be filtered out from proxies list
 */
const SINGBOX_NON_PROXY_TYPES = new Set(['direct', 'block', 'dns', 'selector', 'urltest']);

/**
 * Sing-Box outbound types that represent proxy groups (should be converted to proxy-groups)
 */
const SINGBOX_GROUP_TYPES = new Set(['selector', 'urltest']);

/**
 * Try to parse content as Sing-Box JSON format
 * @param {string} content - The content to parse
 * @returns {object|null} - Parsed result or null if not Sing-Box format
 */
export function parseSingboxJson(content) {
    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.outbounds)) {
            const proxies = parsed.outbounds.filter(o =>
                o && typeof o === 'object' &&
                o.server && o.type &&
                !SINGBOX_NON_PROXY_TYPES.has(o.type)
            );
            if (proxies.length > 0) {
                const configOverrides = deepCopy(parsed);
                delete configOverrides.outbounds;

                // Extract selector/urltest outbounds and convert to Clash proxy-groups format
                const proxyGroups = parsed.outbounds
                    .filter(o => o && SINGBOX_GROUP_TYPES.has(o.type))
                    .map(o => convertSingboxGroupToClashFormat(o))
                    .filter(g => g != null);

                if (proxyGroups.length > 0) {
                    configOverrides['proxy-groups'] = proxyGroups;
                }

                return {
                    type: 'singboxConfig',
                    proxies,
                    config: Object.keys(configOverrides).length > 0 ? configOverrides : null
                };
            }
        }
    } catch (e) {
        // Not valid JSON
    }
    return null;
}

/**
 * Convert Sing-Box selector/urltest outbound to Clash proxy-group format
 * @param {object} outbound - Sing-Box outbound object
 * @returns {object|null} - Clash proxy-group object
 */
function convertSingboxGroupToClashFormat(outbound) {
    if (!outbound || !outbound.tag || !outbound.type) {
        return null;
    }

    const group = {
        name: outbound.tag,
        type: outbound.type === 'selector' ? 'select' : 'url-test',
        proxies: outbound.outbounds || []
    };

    // Add url-test specific fields
    if (outbound.type === 'urltest') {
        group.url = outbound.url || 'http://www.gstatic.com/generate_204';
        // Handle interval - could be string like "5m" or number
        if (outbound.interval) {
            group.interval = parseInterval(outbound.interval);
        } else {
            group.interval = 300;
        }
    }

    return group;
}

/**
 * Parse interval string to seconds
 * @param {string|number} interval - Interval value (e.g., "5m", "300", 300)
 * @returns {number} - Interval in seconds
 */
function parseInterval(interval) {
    if (typeof interval === 'number') {
        return interval;
    }
    if (typeof interval === 'string') {
        const match = interval.match(/^(\d+)(s|m|h)?$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2] || 's';
            switch (unit) {
                case 'h': return value * 3600;
                case 'm': return value * 60;
                default: return value;
            }
        }
        return parseInt(interval) || 300;
    }
    return 300;
}

/**
 * Try to parse content as Clash YAML format
 * @param {string} content - The content to parse
 * @returns {object|null} - Parsed result or null if not Clash format
 */
export function parseClashYaml(content) {
    try {
        const parsed = yaml.load(content);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.proxies)) {
            const proxies = parsed.proxies
                .map(p => convertYamlProxyToObject(p))
                .filter(p => p != null);
            if (proxies.length > 0) {
                const configOverrides = deepCopy(parsed);
                delete configOverrides.proxies;
                return {
                    type: 'yamlConfig',
                    proxies,
                    config: Object.keys(configOverrides).length > 0 ? configOverrides : null
                };
            }
        }
    } catch (e) {
        // Not valid YAML or doesn't have proxies array
    }
    return null;
}

/**
 * Try to parse content as Surge INI format
 * @param {string} content - The content to parse
 * @returns {object|null} - Parsed result or null if not Surge format
 */
export function parseSurgeIni(content) {
    // Quick heuristic: Surge configs have [Proxy] or [General] sections
    const hasSurgeSection = /\[Proxy\]/i.test(content) ||
        (/\[General\]/i.test(content) && /\[Rule\]/i.test(content));
    if (!hasSurgeSection) {
        return null;
    }

    try {
        const parsed = convertSurgeIniToJson(content);
        if (parsed && Array.isArray(parsed.proxies) && parsed.proxies.length > 0) {
            const proxies = parsed.proxies
                .map(line => convertSurgeProxyToObject(line))
                .filter(p => p != null);
            if (proxies.length > 0) {
                const configOverrides = deepCopy(parsed);
                // Remove fields that are handled separately
                delete configOverrides.proxies;

                // Convert Surge proxy-group strings to Clash-compatible objects
                if (Array.isArray(parsed['proxy-groups']) && parsed['proxy-groups'].length > 0) {
                    const proxyGroups = parsed['proxy-groups']
                        .map(line => parseSurgeProxyGroupLine(line))
                        .filter(g => g != null);
                    if (proxyGroups.length > 0) {
                        configOverrides['proxy-groups'] = proxyGroups;
                    } else {
                        delete configOverrides['proxy-groups'];
                    }
                } else {
                    delete configOverrides['proxy-groups'];
                }

                return {
                    type: 'surgeConfig',
                    proxies,
                    config: Object.keys(configOverrides).length > 0 ? configOverrides : null
                };
            }
        }
    } catch (e) {
        // Not valid Surge INI
        console.warn('Surge INI parsing failed:', e?.message || e);
    }
    return null;
}

/**
 * Parse Surge proxy-group line into Clash-compatible object
 * Format: "GroupName = type, Node1, Node2, key=value, ..."
 * @param {string} line - Surge proxy-group line
 * @returns {object|null} - Clash proxy-group object
 */
function parseSurgeProxyGroupLine(line) {
    if (!line || typeof line !== 'string') {
        return null;
    }

    // Format: "GroupName = select, Node1, Node2, ..." or "GroupName = url-test, Node1, url=..., interval=..."
    const match = line.match(/^(.+?)\s*=\s*(\w+[-\w]*)(?:,\s*(.*))?$/);
    if (!match) {
        return null;
    }

    const [, name, type, rest] = match;
    const parts = (rest || '').split(/,\s*/).filter(p => p.trim());

    // Separate proxy list from extra parameters
    const proxies = [];
    const extras = {};

    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('=')) {
            const eqIndex = trimmed.indexOf('=');
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim();
            extras[key] = value;
        } else if (trimmed) {
            proxies.push(trimmed);
        }
    }

    const group = {
        name: name.trim(),
        type: type.toLowerCase() === 'url-test' ? 'url-test' : 'select',
        proxies
    };

    // Add url-test specific fields
    if (extras.url) {
        group.url = extras.url;
    }
    if (extras.interval) {
        group.interval = parseInt(extras.interval) || 300;
    }

    return group;
}

/**
 * Parse subscription content and extract proxies
 * Tries multiple formats in order: Sing-Box JSON -> Clash YAML -> Surge INI -> Line-by-line
 * 
 * @param {string} content - The decoded subscription content
 * @returns {object|string[]} - Parsed config object or array of lines
 */
export function parseSubscriptionContent(content) {
    if (!content || typeof content !== 'string') {
        return [];
    }

    const trimmed = content.trim();
    if (!trimmed) {
        return [];
    }

    // Prefer normalized input object if present
    const normalizedResult = parseNormalizedInputObject(trimmed);
    if (normalizedResult) {
        return normalizedResult;
    }

    // Try Sing-Box JSON first
    const singboxResult = parseSingboxJson(trimmed);
    if (singboxResult) {
        return singboxResult;
    }

    // Try Clash YAML
    const clashResult = parseClashYaml(trimmed);
    if (clashResult) {
        return clashResult;
    }

    // Try Surge INI
    const surgeResult = parseSurgeIni(trimmed);
    if (surgeResult) {
        return surgeResult;
    }

    // Fallback: split by lines (for URI lists)
    return trimmed.split('\n').filter(line => line.trim() !== '');
}
