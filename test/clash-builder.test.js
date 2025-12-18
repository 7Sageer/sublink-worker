import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createTranslator } from '../src/i18n/index.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { sanitizeClashProxyGroups } from '../src/builders/helpers/clashConfigUtils.js';

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

  it('should reference user-defined proxy-providers in generated proxy-groups', async () => {
    const input = `
proxy-providers:
  my-provider:
    type: http
    url: https://example.com/sub
    path: ./my.yaml
    interval: 3600

proxies:
  - name: local
    type: ss
    server: 127.0.0.1
    port: 1080
    cipher: aes-256-gcm
    password: test
`;

    const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const built = yaml.load(yamlText);

    const nodeSelect = (built['proxy-groups'] || []).find(g => g && g.name === '🚀 节点选择');
    expect(nodeSelect).toBeDefined();
    expect(nodeSelect.use).toContain('my-provider');
  });

  it('sanitizeClashProxyGroups should not remove provider node references when group uses providers', () => {
    const config = {
      proxies: [],
      'proxy-groups': [
        {
          name: 'Custom Group',
          type: 'select',
          use: ['my-provider'],
          proxies: ['node-from-provider']
        }
      ]
    };

    sanitizeClashProxyGroups(config);

    const grp = (config['proxy-groups'] || [])[0];
    expect(grp).toBeDefined();
    expect(grp.proxies).toContain('node-from-provider');
  });
});
