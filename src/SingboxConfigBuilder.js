import { SING_BOX_CONFIG, SELECTORS_LIST } from './config.js';
import { ProxyParser } from './ProxyParsers.js';
import { DeepCopy } from './utils.js';

export class ConfigBuilder {
    constructor(inputString) {
        this.inputString = inputString;
        this.config = DeepCopy(SING_BOX_CONFIG);
    }

    async build() {
        const customOutbounds = await this.parseCustomOutbounds();
        this.addCustomOutbounds(customOutbounds);
        this.addSelectors();
        return this.config;
    }

    async parseCustomOutbounds() {
        const urls = this.inputString.split('\n').filter(url => url.trim() !== '');
        const parsedOutbounds = [];

        for (const url of urls) {
            const result = await ProxyParser.parse(url);
            if (Array.isArray(result)) {
                // If the result is an array, it's from an HTTP(S) source
                for (const subUrl of result) {
                    const subResult = await ProxyParser.parse(subUrl);
                    if (subResult) {
                        parsedOutbounds.push(subResult);
                    }
                }
            } else if (result) {
                parsedOutbounds.push(result);
            }
        }

        return parsedOutbounds;
    }

    addCustomOutbounds(customOutbounds) {
        // Filter out null values before adding to config.outbounds
        const validOutbounds = customOutbounds.filter(outbound => outbound != null);
        this.config.outbounds.push(...validOutbounds);
    }

	addSelectors() {
		const tagList = this.config.outbounds.filter(outbound => outbound?.server != undefined).map(outbound => outbound.tag);
        this.config.outbounds.push({
            type: "urltest",
            tag: "⚡ 自动选择",
            outbounds: DeepCopy(tagList),
        });
        tagList.unshift('DIRECT', 'REJECT', '⚡ 自动选择');
		SELECTORS_LIST.forEach(selector => {
			this.config.outbounds.push({
				type: "selector",
				tag: selector,
				outbounds: selector !== '🚀 节点选择' ? ['🚀 节点选择', ...tagList] : tagList
			});
		});
	}
}