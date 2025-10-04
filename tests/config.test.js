import { describe, it, expect, beforeEach, vi } from 'vitest';

if (!globalThis.addEventListener) {
  globalThis.addEventListener = vi.fn();
}

vi.mock('../src/ProxyParsers.js', () => ({
  ProxyParser: {
    parse: vi.fn(async () => ({
      tag: 'Mock Node',
      type: 'shadowsocks',
      server: 'example.com',
      server_port: 443,
      method: 'aes-128-gcm',
      password: 'password',
      network: 'tcp',
      tcp_fast_open: false
    }))
  }
}));

import { generateRules, generateRuleSets, generateClashRuleSets, SING_BOX_CONFIG } from '../src/config.js';

const minimalCustomRule = {
  name: 'Custom Route',
  site: 'alpha,beta',
  ip: 'private',
  domain_suffix: 'example.com',
  domain_keyword: 'keyword',
  ip_cidr: '10.0.0.0/8',
  protocol: 'http,https'
};

describe('custom rule normalization', () => {
  it('handles undefined customRules without throwing', () => {
    expect(() => generateRules(undefined, undefined)).not.toThrow();
    const rules = generateRules(undefined, undefined);
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it('ignores non-object custom rules when generating rule sets', () => {
    const { site_rule_sets, ip_rule_sets } = generateRuleSets(undefined, [null, 'oops', minimalCustomRule]);
    expect(site_rule_sets.some(rule => rule.tag === 'alpha')).toBe(true);
    expect(ip_rule_sets.some(rule => rule.tag === 'private-ip')).toBe(true);
  });

  it('does not mutate the provided customRules array', () => {
    const customRules = [minimalCustomRule];
    const snapshot = structuredClone(customRules);
    generateRules(undefined, customRules);
    expect(customRules).toEqual(snapshot);
  });

  it('creates clash rule providers from valid custom rules only', () => {
    const { site_rule_providers, ip_rule_providers } = generateClashRuleSets(undefined, ['bad', minimalCustomRule]);
    expect(site_rule_providers.alpha).toBeDefined();
    expect(ip_rule_providers.private).toBeDefined();
  });
});

describe('/config route', () => {
  beforeEach(() => {
    globalThis.SUBLINK_KV = {
      get: vi.fn(),
      put: vi.fn()
    };
  });

  it('returns stored config payloads for GET requests', async () => {
    const storedPayload = { foo: 'bar' };
    SUBLINK_KV.get.mockResolvedValue(JSON.stringify(storedPayload));
    const { handleRequest } = await import('../src/index.js');
    const response = await handleRequest(new Request('https://example.com/config?type=singbox&id=singbox_mock'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('singbox');
    expect(body.content).toBe(JSON.stringify(storedPayload, null, 2));
  });

  it('infers config type from identifier when missing', async () => {
    SUBLINK_KV.get.mockResolvedValue(JSON.stringify({ foo: 'bar' }));
    const { handleRequest } = await import('../src/index.js');
    const response = await handleRequest(new Request('https://example.com/config?id=clash_identifier'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.type).toBe('clash');
  });

  it('returns 404 when configuration is absent', async () => {
    SUBLINK_KV.get.mockResolvedValue(null);
    const { handleRequest } = await import('../src/index.js');
    const response = await handleRequest(new Request('https://example.com/config?id=missing_config'));
    expect(response.status).toBe(404);
  });

  it('rejects GET requests without configId', async () => {
    SUBLINK_KV.get.mockResolvedValue(null);
    const { handleRequest } = await import('../src/index.js');
    const response = await handleRequest(new Request('https://example.com/config'));
    expect(response.status).toBe(400);
  });
});

describe('/singbox endpoint', () => {
  beforeEach(() => {
    globalThis.SUBLINK_KV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined)
    };
    if (!globalThis.addEventListener) {
      globalThis.addEventListener = vi.fn();
    }
  });

  it('returns a valid response when customRules is omitted', async () => {
    const { handleRequest } = await import('../src/index.js');
    const requestUrl = 'https://example.com/singbox?config=' + encodeURIComponent('ss://example.com#Mock');
    const response = await handleRequest(new Request(requestUrl));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('outbounds');
    expect(Array.isArray(body.outbounds)).toBe(true);
  });

  it('falls back to minimal rules when selectedRules cannot be parsed', async () => {
    const { handleRequest } = await import('../src/index.js');
    const baseUrl = 'https://example.com/singbox?config=' + encodeURIComponent('ss://example.com#Mock');
    const response = await handleRequest(new Request(`${baseUrl}&selectedRules=%5B%22invalid`));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.route?.rule_set?.length).toBeGreaterThan(0);
  });

  it('does not mutate the shared Sing-Box template between requests', async () => {
    const defaultDetour = '🚀 节点选择';
    expect(SING_BOX_CONFIG.dns.servers[0].detour).toBe(defaultDetour);

    const { handleRequest } = await import('../src/index.js');
    const baseConfigParam = encodeURIComponent('ss://example.com#Mock');

    const zhResponse = await handleRequest(new Request(`https://example.com/singbox?config=${baseConfigParam}&lang=zh-CN`));
    const zhBody = await zhResponse.json();
    expect(zhBody.dns.servers[0].detour).toBe(defaultDetour);

    const enResponse = await handleRequest(new Request(`https://example.com/singbox?config=${baseConfigParam}&lang=en-US`));
    const enBody = await enResponse.json();
    expect(enBody.dns.servers[0].detour).toBe('🚀 Node Select');

    expect(SING_BOX_CONFIG.dns.servers[0].detour).toBe(defaultDetour);
  });
});
