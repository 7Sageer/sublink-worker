import { parseShadowsocks } from './protocols/shadowsocksParser.js';
import { parseVmess } from './protocols/vmessParser.js';
import { parseVless } from './protocols/vlessParser.js';
import { parseHysteria2 } from './protocols/hysteria2Parser.js';
import { parseTrojan } from './protocols/trojanParser.js';
import { parseTuic } from './protocols/tuicParser.js';
import { parseAnytls } from './protocols/anytlsParser.js';
import { fetchSubscription } from './subscription/httpSubscriptionFetcher.js';

const protocolParsers = {
    ss: parseShadowsocks,
    vmess: parseVmess,
    vless: parseVless,
    hysteria: parseHysteria2,
    hysteria2: parseHysteria2,
    hy2: parseHysteria2,
    http: fetchSubscription,
    https: fetchSubscription,
    trojan: parseTrojan,
    tuic: parseTuic,
    anytls: parseAnytls
};

export class ProxyParser {
    static async parse(url, userAgent) {
        if (!url || typeof url !== 'string') {
            return undefined;
        }
        const trimmed = url.trim();
        const type = trimmed.split('://')[0].toLowerCase();
        const parser = protocolParsers[type];
        if (!parser) {
            return undefined;
        }
        try {
            return await parser(trimmed, userAgent);
        } catch (error) {
            // One malformed link must not fail the whole request or, inside a
            // subscription, drop every link after it. The link is not logged
            // because it carries credentials.
            console.warn(`Skipping malformed ${type} link:`, error?.message || error);
            return undefined;
        }
    }
}
