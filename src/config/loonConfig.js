/**
 * Base configuration for Loon.
 */
export const LOON_CONFIG = {
    general: {
        ipv6: false,
        'allow-wifi-access': false,
        'wifi-access-http-port': 7222,
        'wifi-access-socks5-port': 7221,
        'skip-proxy': '127.0.0.1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,100.64.0.0/10,localhost,*.local',
        'bypass-tun': '127.0.0.1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,100.64.0.0/10,localhost,*.local',
        'dns-server': 'system,119.29.29.29,223.5.5.5',
        'doh-server': 'https://223.5.5.5/dns-query',
        'proxy-test-url': 'http://cp.cloudflare.com/generate_204',
        'internet-test-url': 'http://wifi.vivo.com.cn/generate_204',
        'test-timeout': 5
    }
};
