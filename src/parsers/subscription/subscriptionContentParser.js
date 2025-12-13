import yaml from 'js-yaml';
import { deepCopy } from '../../utils.js';
import { convertYamlProxyToObject } from '../convertYamlProxyToObject.js';
import { convertSurgeProxyToObject } from '../convertSurgeProxyToObject.js';
import { convertSurgeIniToJson } from '../../utils/surgeConfigParser.js';

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

