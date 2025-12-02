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
    <a href="https://dash.cloudflare.com/?to=/:account/workers-and-pages/create">
      <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers"/>
    </a>
  </p>
</div>

## 🚀 快速开始

### 快速部署
- Fork本项目，点击上方`Deploy to Cloudflare`按钮
- 在`导入储存库`栏选择你的仓库（你需要绑定Github账户）
- 更改`部署命令`如下，选择`保存并部署`即可使用
``` bash
npm run deploy
```

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
- 中文，英语，波斯语三语言支持

### 客户端支持
- Sing-Box
- Clash
- Xray/V2Ray

### Web 界面特性
- 用户友好的操作界面
- 提供多种预定义规则集
- 可自建关于 geo-site、geo-ip、ip-cidr 和 domain-suffix 的自定义策略组

## 📖 API 文档

详细的 API 文档请参考 [APIDoc.md](/docs/APIDoc.md)

### 主要端点
- `/singbox` - 生成 Sing-Box 配置
- `/clash` - 生成 Clash 配置
- `/xray` - 生成 Xray 配置
- `/shorten` - 生成短链接

## 📝 最近更新

### 2025-05-02

- 现在如果存在相同名称的代理，会自动进行重命名([#175](https://github.com/7Sageer/sublink-worker/pull/175))
- 修复Singbox的DNS配置([#174](https://github.com/7Sageer/sublink-worker/pull/174))

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
    ├── APIDoc.md         # API 文档
    ├── UpdateLogs.md      # 更新日志
    ├── FAQ.md             # 常见问题解答
    └── BaseConfig.md      # 基础配置功能介绍
```

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 免责声明

本项目仅供学习交流使用，请勿用于非法用途。使用本项目所造成的一切后果由使用者自行承担，与开发者无关。

## 💰 赞助

<div align="center">
  <h3>感谢以下赞助商对本项目的支持</h3>
<table border="0">
  <tr>
    <td>
      <a href="https://yxvm.com/" target="_blank" title="YXVM">
        <img src="https://image.779477.xyz/yxvm.png" alt="YXVM" height="60" hspace="20"/>
      </a>
    </td>
    <td>
      <a href="https://github.com/NodeSeekDev/NodeSupport" target="_blank" title="NodeSupport">
        <img src="https://image.779477.xyz/ns.png" alt="NodeSupport" height="60" hspace="20"/>
      </a>
    </td>
  </tr>
</table>
  <p><b>NodeSupport赞助了本项目，感谢他们的支持！</b></p>
  <p>如果您想赞助本项目，请联系开发者 <a href="https://github.com/7Sageer" style="text-decoration: none;">@7Sageer</a></p>
</div>

## ⭐ Star History

感谢所有为本项目点亮 Star 的朋友们！🌟

<a href="https://star-history.com/#7Sageer/sublink-worker&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date" />
 </picture>
</a> 