# 自定义基础配置指南

## 概述

如果你不知道如何配置 SingBox 和 Clash 的配置格式，请不要使用此功能。

我们正试图让用户能够根据自己的需求修改 SingBox 和 Clash 的基础配置。这是一个实验性功能，主要面向高级用户。

如果需要使用此功能，请确保你了解 SingBox 和 Clash 的配置格式，并能够正确配置。

> 注意：此功能目前还在早期开发阶段，可能会出现各种预期之外的问题，请谨慎使用

## 默认配置

### SingBox 默认配置

```json
{
  "dns": {
    "servers": [
      {
        "tag": "dns_proxy",
        "address": "tls://1.1.1.1",
        "address_resolver": "dns_resolver"
      },
      {
        "tag": "dns_direct",
        "address": "h3://dns.alidns.com/dns-query",
        "address_resolver": "dns_resolver",
        "detour": "DIRECT"
      },
      {
        "tag": "dns_fakeip",
        "address": "fakeip"
      },
      {
        "tag": "dns_resolver",
        "address": "223.5.5.5",
        "detour": "DIRECT"
      },
      {
        "tag": "dns_block",
        "address": "rcode://success"
      }
    ],
    "rules": [
      {
        "outbound": ["any"],
        "server": "dns_resolver"
      },
      {
        "geosite": ["category-ads-all"],
        "server": "dns_block",
        "disable_cache": true
      },
      {
        "geosite": ["geolocation-!cn"],
        "query_type": ["A", "AAAA"],
        "server": "dns_fakeip"
      },
      {
        "geosite": ["geolocation-!cn"],
        "server": "dns_proxy"
      }
    ],
    "final": "dns_direct",
    "independent_cache": true,
    "fakeip": {
      "enabled": true,
      "inet4_range": "198.18.0.0/15"
    }
  },
  "ntp": {
    "enabled": true,
    "server": "time.apple.com",
    "server_port": 123,
    "interval": "30m",
    "detour": "DIRECT"
  },
  "inbounds": [
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "0.0.0.0",
      "listen_port": 2080
    },
    {
      "type": "tun",
      "tag": "tun-in", 
      "inet4_address": "172.19.0.1/30",
      "auto_route": true,
      "strict_route": true,
      "stack": "mixed",
      "sniff": true
    }
  ],
  "outbounds": [
    {
      "type": "direct",
      "tag": "DIRECT"
    },
    {
      "type": "block",
      "tag": "REJECT"
    },
    {
      "type": "dns",
      "tag": "dns-out"
    }
  ],
  "route": {},
  "experimental": {
    "cache_file": {
      "enabled": true,
      "store_fakeip": true
    },
    "clash_api": {
      "external_controller": "127.0.0.1:9090",
      "external_ui": "dashboard"
    }
  }
}
```

### Clash 默认配置

```yaml
port: 7890
socks-port: 7891
allow-lan: false
mode: Rule
log-level: info
dns:
  enable: true
  ipv6: true
  respect-rules: true
  enhanced-mode: fake-ip
  nameserver:
    - https://120.53.53.53/dns-query
    - https://223.5.5.5/dns-query
  proxy-server-nameserver:
    - https://120.53.53.53/dns-query
    - https://223.5.5.5/dns-query
  nameserver-policy:
    geosite:cn,private:
      - https://120.53.53.53/dns-query
      - https://223.5.5.5/dns-query
    geosite:geolocation-!cn:
      - https://dns.cloudflare.com/dns-query
      - https://dns.google/dns-query
```

## 注意事项

1. **格式要求**：
   - SingBox 配置必须是有效的 JSON 格式
   - Clash 配置必须是有效的 YAML 格式
   - 目前不支持跨客户端的配置，例如：使用 Clash 的配置文件将无法在 SingBox 中使用
   - 配置中的必要字段不能缺失

2. **保留字段**：
   - 目前程序**不会**自动添加、覆盖任何字段。例如，如果在sing-box配置文件中缺失了`block`, `direct`等字段，将导致程序无法按照预期工作
   - 建议主要修改 DNS、NTP等基础配置，或者在提供的配置基础上修改

3. **配置验证**：
   - 保存前会进行基本的格式验证
   - 建议在本地测试配置是否可用后再使用

4. **持久化存储**：
   - 配置会通过 URL 参数保存
   - 可以通过分享链接分享你的自定义配置

## 配置保存

### 功能说明

- 支持保存自定义的SingBox和Clash基础配置，会以唯一ID的形式存储在KV中，保存期限为30天。
- 点击保存按钮后会生成一个配置ID，使用该ID可以访问到保存的配置。
- 你也可以直接使用通过API进行保存，详见[API文档](./API-doc.md)

### 使用方法

1. 选择配置类型（SingBox或Clash）
2. 在配置编辑器中粘贴你的配置并保存
3. 系统会生成一个配置ID并更新URL，直接点击`Convert`按钮即可获取对应订阅链接
4. 可以直接使用带有configId参数的URL

### 贡献

如果你有任何建议或问题，请随时在[GitHub](https://github.com/7Sageer/sublink-worker)上提交issue。

也欢迎提交PR来完善此功能
