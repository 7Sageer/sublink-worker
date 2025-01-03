<div align="center">
  <h1><b>Sublink Worker</b></h1>
  <h5><i>Serverless 自部署订阅转换工具最佳实践</i></h5>
  
  <a href="https://trendshift.io/repositories/12291" target="_blank">
    <img src="https://trendshift.io/api/badge/repositories/12291" alt="7Sageer%2Fsublink-worker | Trendshift" width="250" height="55"/>
  </a>
  
  <!-- <p>
    <a href="https://sublink-worker.sageer.me">https://sublink-worker.sageer.me</a>
  </p> -->
  <br>

  <p>
    <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/7Sageer/sublink-worker">
      <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers"/>
    </a>
  </p>
</div>

## 🚀 快速开始

### 一键部署
点击上方的 "Deploy to Workers" 按钮，即可快速部署您的专属订阅转换服务。

### 新手指南
- [视频教程1](https://www.youtube.com/watch?v=ZTgDm4qReyA)
- [视频教程2](https://www.youtube.com/watch?v=_1BfM2Chn7w)
- [视频教程3](https://www.youtube.com/watch?v=7abmWqCXPR8)

> 💡 这些是由Youtube社区成员制作的教程视频，详细的讲解可以让你快速上手。但是部分内容可能与我们的见解不同，也可能与最新版本存在差异，建议同时参考[官方文档](/docs)

## ✨ 功能特点

### 支持协议
- ShadowSocks
- VMess
- VLESS
- Hysteria2
- Trojan
- TUIC

### 核心功能
- 支持导入 Base64 的 http/https 订阅链接以及多种协议的分享URL
- 纯JavaScript + Cloudflare Worker实现，一键部署，开箱即用
- 支持固定/随机短链接生成（基于 KV）
- 浅色/深色主题切换
- 灵活的 API，支持脚本化操作

### 客户端支持
- Sing-Box
- Clash
- Xray/V2Ray

### Web 界面特性
- 用户友好的操作界面
- 提供多种预定义规则集
- 可自建关于 geo-site、geo-ip、ip-cidr 和 domain-suffix 的自定义策略组

## 📖 API 文档

详细的 API 文档请参考 [API-doc.md](/docs/API-doc.md)

### 主要端点
- `/singbox` - 生成 Sing-Box 配置
- `/clash` - 生成 Clash 配置
- `/xray` - 生成 Xray 配置
- `/shorten` - 生成短链接

## 📝 最近更新

### 2024-12-27

- 更新了 sing-box tun中废弃的 inet4_address 为 address

## 🔧 项目结构

```
.
├── index.js                 # 主要的服务器逻辑，处理请求路由
├── BaseConfigBuilder.js     # 构建基础配置
├── SingboxConfigBuilder.js  # 构建 Sing-Box 配置
├── ClashConfigBuilder.js    # 构建 Clash 配置
├── ProxyParsers.js         # 解析各种代理协议的 URL
├── utils.js                # 提供各种实用函数
├── htmlBuilder.js          # 生成 Web 界面
├── style.js               # 生成 Web 界面的 CSS
├── config.js              # 保存配置信息
└── docs/
    ├── API-doc.md         # API 文档
    ├── update-log.md      # 更新日志
    └── FAQ.md             # 常见问题解答
```

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

本项目仅供学习交流使用，请勿用于非法用途。使用本项目所造成的一切后果由使用者自行承担，与开发者无关。

## ⭐ Star History

感谢所有为本项目点亮 Star 的朋友们！🌟

[![Star History Chart](https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date)](https://star-history.com/#7Sageer/sublink-worker&Date)
