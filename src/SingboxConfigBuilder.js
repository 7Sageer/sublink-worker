import { SING_BOX_CONFIG, SELECTORS_LIST } from './config.js';
import { BaseConfigBuilder } from './BaseConfigBuilder.js';
import { DeepCopy } from './utils.js';

export class ConfigBuilder extends BaseConfigBuilder {
    constructor(inputString) {
        super(inputString, SING_BOX_CONFIG);
    }

    addCustomItems(customItems) {
        const validItems = customItems.filter(item => item != null);
        this.config.outbounds.push(...validItems);
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

    formatConfig() {
        return this.config;
    }
}