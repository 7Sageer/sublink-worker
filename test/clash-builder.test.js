import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createTranslator } from '../src/i18n/index.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

// Create translator for tests
const t = createTranslator('zh-CN');

describe('Clash Builder Tests', () => {
  it('should clean up proxy-groups and remove non-existent proxies', async () => {
    const input = `
proxies:
  - name: Valid-SS
    type: ss
    server: example.com
    port: 443
    cipher: aes-128-gcm
    password: test
proxy-groups:
  - name: 自定义选择
    type: select
    proxies:
      - DIRECT
      - REJECT
      - Valid-SS
      - NotExist
    `;

    const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    const grp = (built['proxy-groups'] || []).find(g => g && g.name === '自定义选择');
    expect(grp).toBeDefined();

    const expected = ['DIRECT', 'REJECT', 'Valid-SS'];
    const actual = grp.proxies || [];

    expect(actual).toEqual(expected);
  });
});
