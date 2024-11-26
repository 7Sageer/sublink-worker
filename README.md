<div align="center">
  <h1>
    <b>Sublink Worker</b>
  </h1>
</div>


<div align="center">
  <h5>
    <i>Serverless 自部署订阅转换工具最佳实践</i>
  </h5>
</div>

<div align="center">
  <href>
    https://sublink-worker.sageer.me
  </href>
</div>

## 功能特点

- 支持协议：ShadowSocks, VMess, VLESS, Hysteria2, Trojan, TUIC
- 支持导入 Base64 的 http/https 订阅链接
- 一键部署，Vanilla JS + Cloudflare Worker，无需后端
- 支持客户端：
  - Sing-Box
  - Clash
  - Xray/V2Ray
- 支持固定/随机短链接生成（基于 KV）
- 浅色/深色主题切换
- 灵活的 API，支持脚本化操作
- 用户友好的 Web 界面，灵活的自定义规则
  - 提供多种预定义规则集
  - 可自建关于geo-site, geo-ip, ip-cidr和domain-suffix的自定义策略组

## 部署

### （推荐）自动部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/7Sageer/sublink-worker)

### 手动部署

- 克隆项目仓库：`git clone https://github.com/7Sageer/sublink-worker.git`
- 安装依赖：`npm install`
- 配置 Cloudflare 账户凭证
- 使用 Wrangler 部署：`wrangler deploy`

### 新手？
#### [视频教程1](https://www.youtube.com/watch?v=ZTgDm4qReyA)
#### [视频教程2](https://www.youtube.com/watch?v=7abmWqCXPR8)
> 💡 这些是由社区成员制作的教程视频，详细的讲解可以让你快速上手。但是部分内容可能与我们的见解不同，也可能与最新版本存在差异，建议同时参考[官方文档](/docs)
#### [官方FAQ](/docs/FAQ.md)

## API 文档

详细的 API 文档可以在 [API-doc.md](/docs/API-doc.md) 中找到。

主要端点包括：

- `/singbox`：生成 Sing-Box 配置
- `/clash`：生成 Clash 配置
- `/xray`：生成 Xray 配置
- `/shorten`：生成短链接

## 最近更新

- 2024-11-23
  - 修复重复点击生成按钮时，可能导致无法访问短链的问题

[查看更新日志](/docs/update-log.md)

## 项目结构

```
.
├── index.js                 # 主要的服务器逻辑，处理请求路由
├── BaseConfigBuilder.js     # 构建基础配置
├── SingboxConfigBuilder.js  # 构建 Sing-Box 配置
├── ClashConfigBuilder.js    # 构建 Clash 配置
├── ProxyParsers.js          # 解析各种代理协议的 URL
├── utils.js                 # 提供各种实用函数
├── htmlBuilder.js           # 生成 Web 界面
├── style.js                 # 生成 Web 界面的 CSS
├── config.js                # 保存配置信息
└── docs/
    ├── API-doc.md           # API 文档
    ├── update-log.md        # 更新日志
    └── FAQ.md               # 常见问题解答
```

## 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目。

## 许可证

这个项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 免责声明

本项目仅供学习交流使用，请勿用于非法用途。使用本项目所造成的一切后果由使用者自行承担，与开发者无关。

## Star History

感谢所有为本项目点亮 Star 的朋友们！🌟

[![Star History Chart](https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date)](https://star-history.com/#7Sageer/sublink-worker&Date)
