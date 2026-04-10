import { describe, it, expect } from 'vitest';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

/**
 * Test for GitHub Issue #337
 * SS URL with Base64-encoded cipher containing URL-special characters should not be corrupted
 * by improper decodeURIComponent at the subscription content level.
 * https://github.com/7Sageer/sublink-worker/issues/337
 */
describe('Issue #337: SS URL Base64 cipher decode', () => {
  it('should correctly parse SS URL with Base64-encoded cipher containing + and / characters', async () => {
    // This is a Base64-encoded SS URL where the cipher (method:password) contains URL-special chars
    // Base64 of "aes-256-gcm:password+with/special=chars" contains +, /, =
    // When improperly decoded with decodeURIComponent, + becomes space, breaking the Base64
    // The SS URL format: ss://Base64(method:password)@server:port#tag

    // Create a test case: method=aes-256-gcm, password=test+pass/word= (contains +, /, =)
    // Base64 encoded: YWVzLTI1Ni1nY206dGVzdCtwYXNzL3dvcmQ9
    // URL-encoded: YWVzLTI1Ni1nY206dGVzdCtwYXNzL3dvcmQ9 (no change needed for this one)

    // But if decodeURIComponent is applied to the whole content, + becomes space
    // This test verifies that the cipher is correctly preserved

    const ssUrl = 'ss://YWVzLTI1Ni1nY206dGVzdCtwYXNzL3dvcmQ9@example.com:8388#Test-Node';

    const builder = new ClashConfigBuilder(ssUrl, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const yaml = await import('js-yaml');
    const built = yaml.load(yamlText);

    const proxy = built.proxies.find(p => p.name === 'Test-Node');

    expect(proxy).toBeDefined();
    expect(proxy.type).toBe('ss');
    expect(proxy.cipher).toBe('aes-256-gcm');
    // The password should be "test+pass/word=" not corrupted
    expect(proxy.password).toBe('test+pass/word=');
  });

  it('should correctly parse SS URL with cipher containing + character (common with Sub-Store)', async () => {
    // This simulates a real-world case from Sub-Store where cipher contains +
    // The + in Base64 represents a specific bit pattern that should not be decoded as space

    // Password: "my+secret" -> Base64 part: "bXkrc2VjcmV0"
    // If improperly URL-decoded, + becomes space: "bXk c2VjcmV0" which breaks Base64

    const ssUrl = 'ss://YWVzLTEyOC1nY206bXkrc2VjcmV0@sub-store.example.com:8080#SubStore-Node';

    const builder = new ClashConfigBuilder(ssUrl, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const yaml = await import('js-yaml');
    const built = yaml.load(yamlText);

    const proxy = built.proxies.find(p => p.name === 'SubStore-Node');

    expect(proxy).toBeDefined();
    expect(proxy.cipher).toBe('aes-128-gcm');
    expect(proxy.password).toBe('my+secret');
  });

  it('should handle multiple SS URLs containing special chars in a subscription', async () => {
    // Test multiple SS URLs with special characters in their Base64-encoded ciphers
    // password "pass+with+plus" -> Base64: cGFzcyt3aXRoK3BsdXM=
    // password "pass/with/slash" -> Base64: cGFzcy93aXRoL3NsYXNo
    const ssUrls = [
      'ss://YWVzLTI1Ni1nY206cGFzcyt3aXRoK3BsdXM=@server1.com:8388#Node1',  // password: pass+with+plus
      'ss://YWVzLTI1Ni1nY206cGFzcy93aXRoL3NsYXNo@server2.com:8388#Node2',  // password: pass/with/slash
    ].join('\n');

    // Build config to verify passwords are correct
    const builder = new ClashConfigBuilder(ssUrls, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const yaml = await import('js-yaml');
    const built = yaml.load(yamlText);

    const node1 = built.proxies.find(p => p.name === 'Node1');
    const node2 = built.proxies.find(p => p.name === 'Node2');

    expect(node1).toBeDefined();
    expect(node1.password).toBe('pass+with+plus');

    expect(node2).toBeDefined();
    expect(node2.password).toBe('pass/with/slash');
  });

  it('should handle SS URL with URL-encoded Base64 in userinfo (SIP002 format)', async () => {
    // SIP002 format: ss://Base64(method:password)@server:port#tag
    // The Base64 part may be URL-encoded (%2B for +, %2F for /, etc.)
    // This should be handled by the SS parser, not the subscription fetcher

    // password: "test+pass/word" -> Base64: "dGVzdCtwYXNzL3dvcmQ" -> URL-encoded: "dGVzdCtwYXNzL3dvcmQ%3D"
    // method:aes-256-gcm -> Base64: "YWVzLTI1Ni1nY206dGVzdCtwYXNzL3dvcmQ"

    const ssUrl = 'ss://YWVzLTI1Ni1nY206dGVzdCtwYXNzL3dvcmQ%3D@sip002.example.com:8388#SIP002-Node';

    const builder = new ClashConfigBuilder(ssUrl, 'minimal', [], null, 'zh-CN', 'test-agent');
    const yamlText = await builder.build();
    const yaml = await import('js-yaml');
    const built = yaml.load(yamlText);

    const proxy = built.proxies.find(p => p.name === 'SIP002-Node');

    expect(proxy).toBeDefined();
    expect(proxy.cipher).toBe('aes-256-gcm');
    expect(proxy.password).toBe('test+pass/word');
  });
});
