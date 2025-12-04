import yaml from 'js-yaml';
import { decodeBase64, deepCopy } from '../../utils.js';
import { convertYamlProxyToObject } from '../convertYamlProxyToObject.js';

export async function fetchSubscription(url, userAgent) {
    try {
        const headers = new Headers();
        if (userAgent) {
            headers.set('User-Agent', userAgent);
        }
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        let decodedText;
        try {
            decodedText = decodeBase64(text.trim());
            if (decodedText.includes('%')) {
                decodedText = decodeURIComponent(decodedText);
            }
        } catch (e) {
            decodedText = text;
            if (decodedText.includes('%')) {
                try {
                    decodedText = decodeURIComponent(decodedText);
                } catch (urlError) {
                    console.warn('Failed to URL decode the text:', urlError);
                }
            }
        }
        try {
            const parsed = yaml.load(decodedText);
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
        } catch (yamlError) {
            console.warn('YAML parsing failed; fallback to line mode:', yamlError?.message || yamlError);
        }

        return decodedText.split('\n').filter(line => line.trim() !== '');
    } catch (error) {
        console.error('Error fetching or parsing HTTP(S) content:', error);
        return null;
    }
}
