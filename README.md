# Sublink Worker

Sublink Worker 是一个可部署在 Cloudflare Worker 上轻量级的订阅转换工具。它可以将各种代理协议的分享 URL 转换为不同客户端可用的订阅链接。同时还提供灵活的自定义规则与API支持。

![image](/doc/img/main.png)

## 功能特点

- 支持协议：ShadowSocks, VMess, VLESS, Hysteria2, Trojan, TUIC
- 支持导入 Base64 的 http/https 订阅链接
- 一键部署，Vanilla JS + Cloudflare Worker，无需后端
- 支持客户端：
  - Sing-Box
  - Clash
  - Xray/V2Ray
- 支持短链接生成（基于 R2）
- 浅色/深色主题切换
- 灵活的 API，支持脚本化操作
- 用户友好的 Web 界面，灵活的自定义规则：

![image](/doc/img/custom.png)

## 快速开始

### 部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/7Sageer/sublink-worker)

> 注意：确保你的 Cloudflare 账户已经开通 R2 存储服务

## API 文档

详细的 API 文档可以在 [API-doc.md](/doc/API-doc.md) 中找到。

主要端点包括：

- `/singbox`：生成 Sing-Box 配置
- `/clash`：生成 Clash 配置
- `/xray`：生成 Xray 配置
- `/shorten`：生成短链接

## 最近更新

### 2024-09-01

- 自定义规则现在支持以下规则：
  - domain_suffix
  - ip_cidr
  - geoip
  - geosite

### 2024-08-25

- 修复 ClashMeta For Android 高于[v2.10.1]版本不显示规则集的问题

### 2024-08-25

- 优化web界面，修复部分显示错误

### 2024-08-20

- 新增：
  - 自定义规则
  - 自定义规则的 API 支持，详见 [API-doc.md](/doc/API-doc.md)

## 项目结构

- `index.js`: 主要的服务器逻辑，处理请求路由
- `BaseConfigBuilder.js`: 构建基础配置
- `SingboxConfigBuilder.js`: 构建 Sing-Box 配置
- `ClashConfigBuilder.js`: 构建 Clash 配置
- `ProxyParsers.js`: 解析各种代理协议的 URL
- `utils.js`: 提供各种实用函数
- `htmlBuilder.js`: 生成 Web 界面的 HTML
- `config.js`: 保存配置信息

## 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目。

## 许可证

这个项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 免责声明

本项目仅供学习交流使用，请勿用于非法用途。使用本项目所造成的一切后果由使用者自行承担，与开发者无关。

## Star History

感谢所有为本项目点亮 Star 的朋友们！🌟

[![Star History Chart](https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date)](https://star-history.com/#7Sageer/sublink-worker&Date)
