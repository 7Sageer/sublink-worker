import { ProxyParser } from './ProxyParsers.js';
import { DeepCopy } from './utils.js';

export class BaseConfigBuilder {
    constructor(inputString, baseConfig) {
        this.inputString = inputString;
        this.config = DeepCopy(baseConfig);
        this.customRules = [];
    }

    async build() {
        const customItems = await this.parseCustomItems();
        this.addCustomItems(customItems);
        this.addSelectors();
        return this.formatConfig();
    }

    async parseCustomItems() {
        const urls = this.inputString.split('\n').filter(url => url.trim() !== '');
        const parsedItems = [];

        for (const url of urls) {
            const result = await ProxyParser.parse(url);
            if (Array.isArray(result)) {
                for (const subUrl of result) {
                    const subResult = await ProxyParser.parse(subUrl);
                    if (subResult) {
                        parsedItems.push(subResult);
                    }
                }
            } else if (result) {
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