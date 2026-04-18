import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

describe('Issue #366 - avoid empty Auto Select groups', () => {
    it('does not emit an empty urltest outbound when no proxies are parsed', async () => {
        const builder = new SingboxConfigBuilder(
            'not-a-valid-subscription',
            ['Apple', 'Microsoft', 'Streaming'],
            [],
            null,
            'zh-CN',
            'SFI/1.14.0 (20; sing-box 1.13.0; language zh_CN)'
        );

        await builder.build();

        const outbounds = builder.config.outbounds || [];
        const autoSelect = outbounds.find(outbound => outbound?.tag === '⚡ 自动选择');
        const nodeSelect = outbounds.find(outbound => outbound?.tag === '🚀 节点选择');

        expect(autoSelect).toBeUndefined();
        expect(nodeSelect).toBeDefined();
        expect(nodeSelect.outbounds).not.toContain('⚡ 自动选择');
        expect(nodeSelect.outbounds).toEqual(['DIRECT', 'REJECT']);
    });
});
