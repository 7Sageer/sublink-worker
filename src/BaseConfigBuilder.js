import { ProxyParser } from './ProxyParsers.js';
import { DeepCopy } from './utils.js';

export class BaseConfigBuilder {
    constructor(inputString, filters, baseConfig) {
        this.inputString = inputString;
        this.config = DeepCopy(baseConfig);
        this.customRules = [];
        this.filters = filters;
    }

    async build() {
        const customItems = await this.parseCustomItems(this.filters);
        this.addCustomItems(customItems);
        this.addSelectors();
        return this.formatConfig();
    }

    async parseCustomItems(filters) {
        const urls = this.inputString.split('\n').filter(url => url.trim() !== '');
        const parsedItems = [];

        for (const url of urls) {
            const result = await ProxyParser.parse(url);
            if (Array.isArray(result)) {
                for (const subUrl of result) {
                    const subResult = await ProxyParser.parse(subUrl);
                    if (subResult && !filters.some(filter => subResult.tag.includes(filter))) {
                        parsedItems.push(subResult);
                    }
                }
            } else if (result && !filters.some(filter => result.tag.includes(filter))) {
                parsedItems.push(result);
            }
        }

        return parsedItems;
    }

    addCustomItems(customItems) {
        // This method should be implemented in child classes
        throw new Error('addCustomItems must be implemented in child class');
    }

    addSelectors() {
        // This method should be implemented in child classes
        throw new Error('addSelectors must be implemented in child class');
    }

    formatConfig() {
        // This method should be implemented in child classes
        throw new Error('formatConfig must be implemented in child class');
    }
}