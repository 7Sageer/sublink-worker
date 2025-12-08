import yaml from 'js-yaml';
import { deepCopy } from '../../utils.js';
import { convertYamlProxyToObject } from '../convertYamlProxyToObject.js';
import { convertSurgeProxyToObject } from '../convertSurgeProxyToObject.js';
import { convertSurgeIniToJson } from '../../utils/surgeConfigParser.js';

/**
 * Non-proxy outbound types in Sing-Box that should be filtered out
 */
const SINGBOX_NON_PROXY_TYPES = new Set(['direct', 'block', 'dns', 'selector', 'urltest']);

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
                // Remove fields that are handled separately or incompatible
                delete configOverrides.proxies;
                // Surge stores proxy-groups as raw strings like "Proxy = select, Node1, Node2"
                // These are incompatible with Clash/Sing-Box which expect object arrays
                delete configOverrides['proxy-groups'];
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

