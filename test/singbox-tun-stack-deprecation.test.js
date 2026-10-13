import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SING_BOX_CONFIG, SING_BOX_CONFIG_V1_11 } from '../src/config/singboxConfig.js';

/**
 * sing-box 1.15.0 replaced the configurable TUN stack with sing-tun's own
 * stack and deprecated the `stack` option (removed in 1.17.0). Clients >=1.15
 * must not receive it, while older tiers keep it: the field is optional there
 * and `mixed` is the intended TCP/UDP split for them.
 */

const vlessUrl = 'vless://12345678-1234-1234-1234-123456789abc@example.com:443?security=tls&sni=example.com#TestVless';

const buildWithTier = async (tier, baseConfig = null) => {
    const builder = new SingboxConfigBuilder(
        vlessUrl, [], [], baseConfig, 'zh-CN', null, false,
        false, undefined, undefined, tier
    );
    return builder.build();
};

const tunInbound = config => config.inbounds.find(inbound => inbound.type === 'tun');

describe('sing-box TUN stack deprecation', () => {
    it('drops the stack option on the 1.15 tier', async () => {
        const result = await buildWithTier('1.15');
        expect(tunInbound(result)).not.toHaveProperty('stack');
        expect(tunInbound(result).type).toBe('tun');
    });

    it.each(['1.11', '1.12', '1.14'])('keeps the stack option on the %s tier', async (tier) => {
        const baseConfig = tier === '1.11' ? SING_BOX_CONFIG_V1_11 : null;
        const result = await buildWithTier(tier, baseConfig);
        expect(tunInbound(result).stack).toBe('mixed');
    });

    it('strips the stack option from a subscription-provided base config on the 1.15 tier', async () => {
        // Provider configs commonly carry the option; dropping it is valid on
        // every version, so the tier decision must not depend on our templates.
        const customBaseConfig = JSON.parse(JSON.stringify(SING_BOX_CONFIG));
        customBaseConfig.inbounds = [
            ...customBaseConfig.inbounds,
            { type: 'tun', tag: 'tun-extra', address: '172.19.0.2/30', auto_route: true, stack: 'system' }
        ];

        const result = await buildWithTier('1.15', customBaseConfig);
        result.inbounds
            .filter(inbound => inbound.type === 'tun')
            .forEach(inbound => expect(inbound).not.toHaveProperty('stack'));
    });

    it('bundled templates keep the stack option for older clients', () => {
        expect(tunInbound(SING_BOX_CONFIG).stack).toBe('mixed');
        expect(tunInbound(SING_BOX_CONFIG_V1_11).stack).toBe('mixed');
    });
});
