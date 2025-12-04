<div align="center">
  <h1><b>Sublink Worker</b></h1>
  <h5><i>Best Practice for Serverless Self-Deployed Subscription Conversion Tool</i></h5>
  
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
  
  <p><a href="/docs/readme-cn.md">中文文档</a></p>
</div>

## 🚀 Quick Start

### Quick Deployment
- Fork this project, click the `Deploy to Cloudflare` button above
- Select your repository in the `Import Repository` section (you need to link your GitHub account)
- Change the `Deploy Command` as follows, then select `Save and Deploy`
``` bash
npm run deploy
```

### Run with Node/Vercel/Docker
- **Local Node runtime**
  - `npm run build:node && node dist/node-server.cjs`
  - Provide storage credentials via `REDIS_URL` (or `REDIS_HOST`/`REDIS_PORT`) for self-hosted Redis, or fall back to `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Upstash/Vercel KV). Without either option a temporary in-memory store is used.
  - Set `DISABLE_MEMORY_KV=true` if you prefer the process to fail fast when no persistent backend is configured.
- **Vercel**
  - Set `KV_REST_API_URL` and `KV_REST_API_TOKEN` inside your project settings (Vercel KV supplies both automatically).
  - `vercel deploy` (rewrites are configured in `vercel.json` to serve the Hono app from `api/index.js`).
- **Docker**
  - Pull the published image: `docker pull ghcr.io/7sageer/sublink-worker:latest`
  - Run: `docker run -p 8787:8787 -e REDIS_HOST=redis -e REDIS_PORT=6379 ghcr.io/7sageer/sublink-worker:latest`
  - Build locally when testing changes: `docker build -t sublink-worker:dev .` and point Compose to it with `SUBLINK_WORKER_IMAGE=sublink-worker:dev docker compose up`.
  - The container listens on `8787` by default; override with `PORT`.
  - See `docker-compose.yml` for a ready-to-use Redis deployment (RDB persistence enabled by default).

#### Docker Compose (Redis)

If you prefer a fully self-hosted stack, run `docker compose up -d` to start both the worker and a Redis 7 instance configured with RDB snapshots (`redis.conf`). Compose pulls the multi-arch image from GHCR by default; set `SUBLINK_WORKER_IMAGE` if you need to pin a specific tag or a locally built image. Data is stored on the `redis-data` volume, so short links/configurations survive container restarts.

### Runtime Environment Variables
| Variable | Description | Default |
| --- | --- | --- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash/Vercel KV REST endpoint + token, used outside Cloudflare Workers | unset |
| `REDIS_URL` | Connection URL (`redis://user:pass@host:port/0`) for direct Redis access | unset |
| `REDIS_HOST` / `REDIS_PORT` | Host/port pair if you don't use `REDIS_URL` | unset |
| `REDIS_USERNAME` / `REDIS_PASSWORD` | Optional auth for Redis deployments | unset |
| `REDIS_TLS` | Set to `true` to enable TLS when connecting to Redis | `false` |
| `REDIS_KEY_PREFIX` | Optional namespacing prefix applied to each Redis key | unset |
| `CONFIG_TTL_SECONDS` | TTL applied to stored base configs | `2592000` (30 days) |
| `SHORT_LINK_TTL_SECONDS` | TTL applied to generated short links (if supported by runtime) | no expiry |
| `STATIC_DIR` | Directory for serving assets in Node/Vercel runtime | `public` |
| `DISABLE_MEMORY_KV` | When `true`, disables the in-memory KV fallback on Node/Vercel | `false` |

### Storage Backends

Node/Vercel/Docker builds resolve storage in this order:
1. Redis (`REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`) — pairs naturally with the provided Docker Compose file and gives full control over persistence (RDB snapshots by default).
2. Upstash/Vercel KV (`KV_REST_API_URL` + `KV_REST_API_TOKEN`).
3. In-memory KV (unless `DISABLE_MEMORY_KV=true`).

Choose the option that matches your operational needs; Redis is recommended when you deploy via Docker and require self-managed persistence.

## 🧱 Container Image & CI

Every push to `main`, version tag, or manual trigger runs `.github/workflows/docker-image.yml`, which builds a multi-architecture container and publishes it to `ghcr.io/7sageer/sublink-worker` with the tags `latest`, the branch/tag name, and the commit SHA. Docker Compose references this image via `SUBLINK_WORKER_IMAGE` by default, so you can simply run `docker compose pull && docker compose up -d` to stay current, or override the variable to pin a specific tag.

## ✨ Features

### Supported Protocols
- ShadowSocks
- VMess
- VLESS
- Hysteria2
- Trojan
- TUIC

### Core Features
- Support for importing Base64 http/https subscription links and various protocol sharing URLs
- Pure JavaScript + Cloudflare Worker implementation, one-click deployment, ready to use
- Support for fixed/random short link generation (based on KV)
- Light/Dark theme toggle
- Flexible API, supporting script operations
- Support for Chinese, English, and Persian languages

### Client Support
- Sing-Box
- Clash
- Xray/V2Ray

### Web Interface Features
- User-friendly operation interface
- Various predefined rule sets
- Customizable policy groups for geo-site, geo-ip, ip-cidr, and domain-suffix

## 📖 API Documentation

For detailed API documentation, please refer to [api-doc.md](/docs/api-doc.md)

### Main Endpoints
- `/singbox` - Generate Sing-Box configuration
- `/clash` - Generate Clash configuration
- `/xray` - Generate Xray configuration
- `/shorten` - Generate short links

## 📝 Recent Updates

### 2025-11-08

- feat(config): Added support for proxy configuration grouped by country, updated related translations

## 🔧 Project Structure

```
.
├── index.js                 # Main server logic, handles request routing
├── BaseConfigBuilder.js     # Build base configuration
├── SingboxConfigBuilder.js  # Build Sing-Box configuration
├── ClashConfigBuilder.js    # Build Clash configuration
├── ProxyParsers.js          # Parse URLs of various proxy protocols
├── utils.js                 # Provide various utility functions
├── htmlBuilder.js           # Generate Web interface
├── style.js                 # Generate CSS for Web interface
├── config.js                # Store configuration information
└── docs/
    ├── api-doc.md           # API documentation
    ├── update-logs.md       # Update logs
    ├── faq.md               # Frequently asked questions
    └── base-config.md       # Basic configuration feature introduction
```

## 🤝 Contribution

Issues and Pull Requests are welcome to improve this project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is for learning and exchange purposes only. Please do not use it for illegal purposes. All consequences resulting from the use of this project are solely the responsibility of the user and are not related to the developer.

## 💰 Sponsorship

<div align="center">
  <h3>Thanks to the following sponsors for their support of this project</h3>
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
  <p><b>NodeSupport has sponsored this project, thank you for your support!</b></p>
  <p>If you would like to sponsor this project, please contact the developer <a href="https://github.com/7Sageer" style="text-decoration: none;">@7Sageer</a></p>
</div>

## ⭐ Star History

Thanks to everyone who has starred this project! 🌟

<a href="https://star-history.com/#7Sageer/sublink-worker&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=7Sageer/sublink-worker&type=Date" />
 </picture>
</a>
