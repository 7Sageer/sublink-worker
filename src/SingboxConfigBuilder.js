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
		return Promise.all(urls.map(url => ProxyParser.parse(url)));
	}

	addCustomOutbounds(customOutbounds) {
		// Filter out null values before adding to config.outbounds
		const validOutbounds = customOutbounds.filter(outbound => outbound != null);
		this.config.outbounds.push(...validOutbounds);
	}

	addSelectors() {
		const tagList = this.config.outbounds.filter(outbound => outbound.type != 'selector').map(outbound => outbound?.tag);
		SELECTORS_LIST.forEach(selector => {
			this.config.outbounds.push({
				type: "selector",
				tag: selector,
				outbounds: selector !== '🚀 节点选择' ? ['🚀 节点选择', ...tagList] : tagList
			});
		});
	}
}
