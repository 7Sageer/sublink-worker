import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import {
  CLASH_DEFAULT_NAMESERVERS,
  CLASH_DOMESTIC_DNS_SERVERS,
  CLASH_FOREIGN_DNS_SERVERS
} from '../src/config/index.js';

const PROXY = `
proxies:
  - name: Test-Node
    type: ss
    server: example.com
    port: 443
    cipher: aes-128-gcm
    password: test
`;

describe('Clash DNS routing', () => {
  it('uses the domestic whitelist model in the default output', async () => {
    expect(CLASH_DEFAULT_NAMESERVERS).toEqual(['223.5.5.5', '119.29.29.29']);
    expect(CLASH_DOMESTIC_DNS_SERVERS).toEqual([
      'https://120.53.53.53/dns-query',
      'https://223.5.5.5/dns-query'
    ]);
    expect(CLASH_FOREIGN_DNS_SERVERS).toEqual([
      'https://1.1.1.1/dns-query#RULES',
      'https://8.8.8.8/dns-query#RULES'
    ]);

    const builder = new ClashConfigBuilder(PROXY, 'minimal', [], null, 'zh-CN', 'mihomo/1.0');
    const config = yaml.load(await builder.build());
    const dns = config.dns;

    expect(dns.enable).toBe(true);
    expect(dns.ipv6).toBe(true);
    expect(dns['enhanced-mode']).toBe('fake-ip');
    expect(dns['respect-rules']).toBe(false);
    expect(dns['default-nameserver']).toEqual([...CLASH_DEFAULT_NAMESERVERS]);
    expect(dns.nameserver).toEqual([...CLASH_FOREIGN_DNS_SERVERS]);
    expect(dns['proxy-server-nameserver']).toEqual([...CLASH_DOMESTIC_DNS_SERVERS]);
    expect(dns['direct-nameserver']).toEqual([...CLASH_DOMESTIC_DNS_SERVERS]);
    expect(dns['direct-nameserver-follow-policy']).toBe(false);
    expect(dns['nameserver-policy']).toEqual({
      'geosite:private,cn': [...CLASH_DOMESTIC_DNS_SERVERS],
      'rule-set:cn': [...CLASH_DOMESTIC_DNS_SERVERS],
      'rule-set:geolocation-cn': [...CLASH_DOMESTIC_DNS_SERVERS]
    });
  });

  it('normalizes merged upstream DNS without discarding unrelated settings', async () => {
    const input = `${PROXY}
dns:
  enable: false
  ipv6: false
  enhanced-mode: redir-host
  fake-ip-filter:
    - '*.internal'
  hosts:
    example.internal: 192.0.2.1
  respect-rules: true
  default-nameserver:
    - 8.8.8.8
  nameserver:
    - 8.8.8.8
  proxy-server-nameserver:
    - 1.1.1.1
  direct-nameserver:
    - 1.0.0.1
  direct-nameserver-follow-policy: true
  fallback:
    - 9.9.9.9
  fallback-filter:
    geoip: true
  fallback-lazy-query: true
  proxy-server-nameserver-policy:
    '+.proxy.example': 9.9.9.9
  nameserver-policy:
    geosite:cn,private: 8.8.8.8
    geosite:geolocation-!cn: 8.8.4.4
    rule-set:cn: 1.1.1.1
    rule-set:geolocation-cn: 1.0.0.1
    rule-set:geolocation-!cn: 9.9.9.9
    '+.github.com': 192.0.2.53
`;
    const builder = new ClashConfigBuilder(input, 'minimal', [], null, 'zh-CN', 'mihomo/1.0');
    const config = yaml.load(await builder.build());
    const dns = config.dns;

    expect(dns.enable).toBe(true);
    expect(dns.ipv6).toBe(false);
    expect(dns['enhanced-mode']).toBe('redir-host');
    expect(dns['fake-ip-filter']).toEqual(['*.internal']);
    expect(dns.hosts).toEqual({ 'example.internal': '192.0.2.1' });
    expect(dns['respect-rules']).toBe(false);
    expect(dns['default-nameserver']).toEqual([...CLASH_DEFAULT_NAMESERVERS]);
    expect(dns.nameserver).toEqual([...CLASH_FOREIGN_DNS_SERVERS]);
    expect(dns['proxy-server-nameserver']).toEqual([...CLASH_DOMESTIC_DNS_SERVERS]);
    expect(dns['direct-nameserver']).toEqual([...CLASH_DOMESTIC_DNS_SERVERS]);
    expect(dns['direct-nameserver-follow-policy']).toBe(false);
    expect(dns).not.toHaveProperty('fallback');
    expect(dns).not.toHaveProperty('fallback-filter');
    expect(dns).not.toHaveProperty('fallback-lazy-query');
    expect(dns).not.toHaveProperty('proxy-server-nameserver-policy');
    expect(dns['nameserver-policy']).toEqual({
      '+.github.com': '192.0.2.53',
      'geosite:private,cn': [...CLASH_DOMESTIC_DNS_SERVERS],
      'rule-set:cn': [...CLASH_DOMESTIC_DNS_SERVERS],
      'rule-set:geolocation-cn': [...CLASH_DOMESTIC_DNS_SERVERS]
    });
  });

  it('only references domestic rule providers that exist in the final config', async () => {
    const builder = new ClashConfigBuilder(PROXY, ['AI Services'], [], null, 'zh-CN', 'mihomo/1.0');
    const config = yaml.load(await builder.build());
    const policy = config.dns['nameserver-policy'];

    expect(config['rule-providers']).not.toHaveProperty('cn');
    expect(config['rule-providers']).not.toHaveProperty('geolocation-cn');
    expect(policy).toEqual({
      'geosite:private,cn': [...CLASH_DOMESTIC_DNS_SERVERS]
    });
    expect(policy).not.toHaveProperty('geosite:geolocation-!cn');
    expect(policy).not.toHaveProperty('rule-set:geolocation-!cn');
  });
});
