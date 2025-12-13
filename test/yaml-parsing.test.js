import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { createTranslator } from '../src/i18n/index.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { BaseConfigBuilder } from '../src/builders/BaseConfigBuilder.js';

// Test cases inline (from test-cases.yaml)
const testCases = [
    {
        name: '原始 YAML 配置测试',
        description: '验证 GitHub Gist 示例中的 Clash YAML 是否被正确解析',
        input: `proxies:
  - name: HY2-main
    type: hysteria2
    server: hajimi.com
    port: 443
    ports: 20000-20100
    hop-interval: 15
    up: "200 Mbps"
    down: "200 Mbps"
    password: REPLACE_HY2_PASS
    sni: hajimi.com
    obfs: salamander
    obfs-password: REPLACE_OBFS_PASS
    alpn:
      - h3
    skip-cert-verify: false
    fast-open: true

  - name: TUIC-main
    type: tuic
    server: hajimi.com
    port: 444
    uuid: REPLACE_TUIC_UUID
    password: REPLACE_TUIC_PASS
    sni: hajimi.com
    alpn:
      - h3
    reduce-rtt: true
    congestion-controller: bbr
    udp-relay-mode: native
    zero-rtt: false
    fast-open: true
    skip-cert-verify: false

  - name: VLESS-REALITY
    type: vless
    server: hajimi.com
    port: 445
    uuid: REPLACE_VLESS_UUID
    udp: true
    flow: xtls-rprx-vision
    tls: true
    servername: www.apple.com
    alpn:
      - h2
      - http/1.1
    client-fingerprint: chrome
    reality-opts:
      public-key: REPLACE_PUBLIC_KEY
      short-id: a1b2c3
    packet-encoding: xudp
    skip-cert-verify: false`,
        expected: {
            proxyCount: 3,
            proxyTags: ['HY2-main', 'TUIC-main', 'VLESS-REALITY'],
            typeCount: { hysteria2: 1, tuic: 1, vless: 1 }
        }
    },
    {
        name: '空代理列表',
        description: 'proxies 数组为空时不应返回任何节点',
        input: 'proxies: []',
        expected: { proxyCount: 0 }
    },
    {
        name: '混合类型与无效节点',
        description: '仅返回受支持类型的节点，忽略未知类型',
        input: `proxies:
  - name: Valid-SS
    type: ss
    server: example.com
    port: 443
    cipher: aes-128-gcm
    password: test

  - name: Invalid-Type
    type: unknown
    server: invalid.com
    port: 80`,
        expected: {
            proxyCount: 1,
            proxyTags: ['Valid-SS'],
            typeCount: { shadowsocks: 1 }
        }
    },
    {
        name: 'Base64 编码 YAML',
        description: '验证 Base64 包裹的 YAML 能被正确解析',
        input: 'cHJveGllczoKICAtIG5hbWU6IEJhc2U2NC1ZQU1MLVRlc3QKICAgIHR5cGU6IHR1aWMKICAgIHNlcnZlcjogdGVzdC5jb20KICAgIHBvcnQ6IDQ1NQogICAgdXVpZDogNzJlMjQ1YzUtYzY4MS00Y2JjLTljY2QtN2IxMGJiOGYyYzUzCiAgICBwYXNzd29yZDogdGVzdC1wYXNzCiAgICBzbmk6IHRlc3QuY29tCiAgICBhbHBuOgogICAgICAtIGgzCiAgICB4dWRwOiB0cnVlCiAgICB6aXA6IHh1ZHAKICAgIHNraXAtY2VydC12ZXJpZnk6IGZhbHNlCg==',
        expected: {
            proxyCount: 1,
            proxyTags: ['Base64-YAML-Test'],
            typeCount: { tuic: 1 }
        }
    },
    {
        name: 'ANYTLS 基本解析',
        description: '验证 anytls 节点解析与关键字段（tag、idle-session、alpn 等）',
        input: `proxies:
  - name: ANYTLS-main
    type: anytls
    server: example.com
    port: 443
    password: REPLACE_ANYTLS_PASS
    udp: true
    sni: example.com
    alpn:
      - h2
      - http/1.1
    client-fingerprint: chrome
    skip-cert-verify: false
    idle-session-check-interval: 30
    idle-session-timeout: 120
    min-idle-session: 5`,
        expected: {
            proxyCount: 1,
            proxyTags: ['ANYTLS-main'],
            typeCount: { anytls: 1 },
            proxyDetails: [
                {
                    tag: 'ANYTLS-main',
                    fields: {
                        type: 'anytls',
                        udp: true,
                        'tls.server_name': 'example.com',
                        'tls.insecure': false,
                        'tls.alpn': ['h2', 'http/1.1'],
                        'tls.utls.fingerprint': 'chrome',
                        'idle-session-check-interval': 30,
                        'idle-session-timeout': 120,
                        'min-idle-session': 5
                    }
                }
            ]
        }
    },
    {
        name: '解析 proxy-groups 段',
        description: '验证 Clash YAML 中的 proxy-groups 能被保留在配置中',
        input: `proxies:
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
      - NotExist`,
        expected: {
            proxyCount: 1,
            typeCount: { shadowsocks: 1 },
            config: {
                'proxy-groups': [
                    {
                        name: '自定义选择',
                        type: 'select',
                        proxies: ['DIRECT', 'REJECT', 'Valid-SS', 'NotExist']
                    }
                ]
            }
        }
    }
];

/**
 * Helper function to get nested property by path (e.g., "tls.alpn")
 */
function getByPath(obj, path) {
    return String(path)
        .split('.')
        .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

/**
 * Evaluate test results against expected values
 */
function evaluateResult(items, builder, expected) {
    const report = { passed: true, messages: [] };
    const tags = items.map(item => item?.tag).filter(Boolean);

    // Check proxy count
    if (typeof expected.proxyCount === 'number') {
        if (items.length !== expected.proxyCount) {
            report.passed = false;
            report.messages.push(`Expected ${expected.proxyCount} proxies, got ${items.length}`);
        }
    }

    // Check proxy tags
    if (Array.isArray(expected.proxyTags)) {
        const missing = expected.proxyTags.filter(tag => !tags.includes(tag));
        if (missing.length > 0) {
            report.passed = false;
            report.messages.push(`Missing expected nodes: ${missing.join(', ')}`);
        }
    }

    // Check type counts
    if (expected.typeCount && typeof expected.typeCount === 'object') {
        const typeSummary = items.reduce((acc, item) => {
            if (!item || !item.type) return acc;
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {});
        Object.entries(expected.typeCount).forEach(([type, count]) => {
            if (typeSummary[type] !== count) {
                report.passed = false;
                report.messages.push(`Type ${type} expected ${count}, got ${typeSummary[type] || 0}`);
            }
        });
    }

    // Check config fields
    if (expected.config && typeof expected.config === 'object') {
        Object.entries(expected.config).forEach(([key, value]) => {
            if (JSON.stringify(builder.config?.[key]) !== JSON.stringify(value)) {
                report.passed = false;
                report.messages.push(`Config field ${key} does not match expected value`);
            }
        });
    }

    // Check proxy details (supports dot notation paths like "tls.alpn")
    if (Array.isArray(expected.proxyDetails)) {
        expected.proxyDetails.forEach(({ tag, fields }) => {
            const item = items.find(it => it && it.tag === tag);
            if (!item) {
                report.passed = false;
                report.messages.push(`Node ${tag} not found for field validation`);
                return;
            }
            Object.entries(fields || {}).forEach(([path, expectedValue]) => {
                const actual = getByPath(item, path);
                if (JSON.stringify(actual) !== JSON.stringify(expectedValue)) {
                    report.passed = false;
                    report.messages.push(
                        `Node ${tag} field ${path} expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actual)}`
                    );
                }
            });
        });
    }

    return report;
}

describe('YAML Parsing Tests', () => {
    testCases.forEach((testCase) => {
        it(testCase.name, async () => {
            const builder = new BaseConfigBuilder(testCase.input, {}, 'zh-CN', 'test-agent');
            const items = await builder.parseCustomItems();

            const result = evaluateResult(items, builder, testCase.expected || {});

            if (!result.passed) {
                throw new Error(result.messages.join('\n'));
            }

            expect(result.passed).toBe(true);
        });
    });
});
