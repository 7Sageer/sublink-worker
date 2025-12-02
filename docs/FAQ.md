# FAQ

如果你发现文档中没有你遇到的问题，请务必提交 Issue。

## 使用

---

### 我看到你的仓库更新了，我应该如何同步？

在**你自己的**仓库主页面，点击右上角的 **Sync fork** 按钮，即可同步。

---

### 为什么生成的链接无法在国内访问？

Cloudflare Worker 的`workers.dev`域名默认无法在国内访问。

要解决这个问题，你可以：

- 绑定自己的域名
- 使用代理获取/更新订阅

---

### 对于 Node/Docker 部署，如何确保 KV 持久化？

- 推荐使用仓库内置的 `docker-compose.yml`，它会启动 Redis 7 并应用 `redis.conf` 中的 RDB 策略（快照写入 `redis-data` 卷）。Worker 通过 `REDIS_HOST`/`REDIS_PORT` 接入该实例即可。
- Compose 默认拉取 `ghcr.io/7sageer/sublink-worker` 中由 GitHub Actions 自动发布的镜像。如果你需要使用自建镜像，在执行 `docker compose up` 前设置 `SUBLINK_WORKER_IMAGE=<你的镜像>` 即可。
- 如果你倾向于托管服务，可配置 `KV_REST_API_URL`、`KV_REST_API_TOKEN` 使用 Upstash/Vercel KV；若两者都未设置，将回退到内存存储（不持久化），可用 `DISABLE_MEMORY_KV=true` 禁止这种回退。
