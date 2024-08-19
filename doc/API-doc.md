# Sublink Worker API 文档

## 概述

Sublink Worker 是一个部署在 Cloudflare Workers 上的轻量级订阅转换工具。它可以将各种代理协议的分享 URL 转换为不同客户端可用的订阅链接。本文档概述了 API 端点及其用法。

## 基础 URL

所有 API 请求应发送至:

```
https://your-worker-domain.workers.dev
```

将 `your-worker-domain` 替换为您实际的 Cloudflare Workers 域名。

## 端点

### 1. 生成配置

#### Sing-Box 配置

- **URL**: `/singbox`
- **方法**: GET
- **参数**:
  - `config` (必需): URL 编码的字符串,包含一个或多个代理配置
  - `selectedRules` (可选): 预定义规则集名称或自定义规则的 JSON 数组

**示例**:
```
/singbox?config=vmess%3A%2F%2Fexample&selectedRules=balanced
```
或
```
/singbox?config=vmess%3A%2F%2Fexample&selectedRules=%5B%22Ad%20Block%22%2C%22Private%22%5D
```

#### Clash 配置

- **URL**: `/clash`
- **方法**: GET
- **参数**: 与 Sing-Box 配置相同

#### Xray 配置

- **URL**: `/xray`
- **方法**: GET
- **参数**:
  - `config` (必需): URL 编码的字符串,包含一个或多个代理配置

### 2. 缩短 URL

- **URL**: `/shorten`
- **方法**: GET
- **参数**:
  - `url` (必需): 需要缩短的原始 URL

**示例**:
```
/shorten?url=https%3A%2F%2Fexample.com%2Fvery-long-url
```

**响应**:
```json
{
  "shortUrl": "https://your-worker-domain.workers.dev/s/abcdefg"
}
```

### 3. 重定向短 URL

- **URL**: `/s/{shortCode}`
- **方法**: GET
- **描述**: 重定向到与短代码关联的原始 URL

## 预定义规则集

API 支持以下预定义规则集:

- `minimal`: 基本规则集
- `balanced`: 适中规则集
- `comprehensive`: 完整规则集

这些可以在 Sing-Box 和 Clash 配置的 `selectedRules` 参数中使用。

## 自定义规则

除了使用预定义规则集,您还可以在 `selectedRules` 参数中提供自定义规则列表作为 JSON 数组。可用规则包括:

| Rule Name | Used Site Rules | Used IP Rules |
|---|---|---|
| Ad Block | category-ads-all |  |
| AI Services | openai,anthropic,jetbrains-ai,perplexity |  |
| Bilibili | bilibili |  |
| Youtube | youtube |  |
| Google | google | google |
| Private |  | private |
| Location:CN | geolocation-cn | cn |
| Telegram |  | telegram |
| Microsoft | microsoft |  |
| Apple | apple |  |
| Bahamut | bahamut |  |
| Social Media | facebook, instagram, twitter, tiktok, linkedin |  |
| Streaming | netflix, hulu, disney, hbo, amazon |  |
| Gaming | steam, epicgames, ea, ubisoft, blizzard |  |
| Github | github, gitlab |  |
| Education | coursera, edx, udemy, khanacademy |  |
| Financial | paypal, visa, mastercard, stripe, wise |  |
| Cloud Services | aws, azure, digitalocean, heroku, dropbox |  |

> SingBox的规则集来自于[https://github.com/lyc8503/sing-box-rules](https://github.com/lyc8503/sing-box-rules), 感谢lyc8503的贡献！

## 错误处理

API 在出现问题时将返回适当的 HTTP 状态码和错误消息:

- 400 Bad Request: 当缺少必需参数或参数无效时
- 404 Not Found: 当请求的资源(如短 URL)不存在时
- 500 Internal Server Error: 服务器端错误

## 使用说明

1. `config` 参数中的所有代理配置应进行 URL 编码。
2. 可以在单个请求中包含多个代理配置,方法是在 URL 编码的 `config` 参数中用换行符 (`%0A`) 分隔它们。
3. 使用自定义规则时,确保规则名称与自定义规则部分列出的名称完全匹配。
4. 缩短的 URL 旨在临时使用,可能在一定时间后过期。

## 示例

1. 生成带有平衡规则集的 Sing-Box 配置:
   ```
   /singbox?config=vmess%3A%2F%2Fexample&selectedRules=balanced
   ```

2. 生成带有自定义规则的 Clash 配置:
   ```
   /clash?config=vless%3A%2F%2Fexample&selectedRules=%5B%22Ad%20Block%22%2C%22Google%22%2C%22Streaming%22%5D
   ```

3. 缩短 URL:
   ```
   /shorten?url=https%3A%2F%2Fyour-worker-domain.workers.dev%2Fsingbox%3Fconfig%3Dvmess%253A%252F%252Fexample%26selectedRules%3Dbalanced
   ```

## 结论

我们的 API 提供了一种灵活而强大的方式来生成和管理代理配置。它支持多种代理协议、各种客户端类型和可自定义的路由规则。URL 缩短功能允许轻松共享和管理复杂的配置。

如有任何问题或功能请求，欢迎联系仓库维护者。
