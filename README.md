# Sublink Worker

这是一个可部署在Cloudflare Worker的轻量级订阅转换工具，用于将各种代理协议的分享url转换为不同客户端可用的订阅链接。

![image](/doc/main.png)

演示地址：[https://sublink-worker.seven7-ade.workers.dev/](https://sublink-worker.seven7-ade.workers.dev/)
> 提示：请保护自己的数据，建议[自行部署](#最近更新)

## 功能特点

- 支持协议：SS, VMess, VLESS, Hysteria2, Trojan, TUIC
- 支持导入Base64的http/https订阅链接
- [一键部署](#最近更新)，Vanilla JS + Cloudflare Worker，无需后端
- 支持客户端：
  - Sing-Box
  - Clash
  - Xray/V2Ray
- 支持短链接生成（基于R2）
- 浅色/深色主题切换
- 快速上手的Web界面，提供主流自定义路由规则:
![image](/doc/rules.png)


## 最近更新

### 13/8

- 修复hy2协议解析问题

---

### 10/8

- 添加快速选择规则集
- 细化规则集
  - 增添更多分类
  - 将OpenAI改为AI服务，包含Claude，Jetbrains-AI等规则
  - 优化显示

---

### 7/8

- 优化UI


## 部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/7Sageer/sublink-worker)

> 提示：确保你的Cloudflare账户已经开通R2储存服务

## 项目结构

- `index.js`: 主要的服务器逻辑，处理请求路由
- `BaseConfigBuilder.js`: 构建基础配置
- `SingboxConfigBuilder.js`: 构建Sing-Box配置
- `ClashConfigBuilder.js`: 构建Clash配置
- `ProxyParsers.js`: 解析各种代理协议的URL
- `utils.js`: 提供各种实用函数
- `htmlBuilder.js`: 生成Web界面的HTML
- `config.js`: 保存配置信息

## API 端点

- `/`: Web界面
- `/singbox`: 获取Sing-Box配置
- `/xray`: 获取XRay基础配置
- `/clash`: 获取Clash配置
- `/shorten-all`: 短链接生成API
- `/s`, `/x`, `/c`: 短链接跳转

## 许可证

这个项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 免责声明

本项目仅供学习交流使用，请勿用于非法用途。使用本项目所造成的一切后果由使用者自行承担，与开发者无关
