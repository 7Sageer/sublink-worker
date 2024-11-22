# FAQ

如果你发现文档中没有你遇到的问题，请务必提交 Issue。

## 部署

---

### 我不清楚如何部署

如果你没有 Cloudflare 账号或 Github 账号，请先注册。

点击[Readme.md](../Readme.md)中的 **Deploy to Cloudflare** 按钮，按照提示操作即可。

根据提示点点点即可，你仅需手动填写 **Account ID** 和 **API token**，详见 [如何获取 Worker Account ID 和 API token？](#如何获取-worker-account-id-和-api-token)

---

### 如何获取 Worker Account ID 和 API token？

**获取 Worker Account ID**

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧的 **Workers 和 Pages**
3. 在右栏即可看到你的账户 ID

---

**获取 API token**

1. 打开 [Cloudflare API](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **创建令牌**
3. 在 **API 令牌模板** 中选择 **编辑 Cloudflare Workers** 栏，点击 **使用模板**
4. 配置 **名称** 和 **资源**，点击 **创建令牌**

> 如果要使用自定义权限的令牌，注意在 Cloudflare API 中，**读取** 与 **编辑** 权限是分开的，**编辑** 权限不包含 **读取** 权限。因此请确保勾选 **编辑** 权限时，也将 **读取** 权限勾选。


---

### 为什么部署失败了？

1. 参考 [如何获取 Worker Account ID 和 API token？](#如何获取-worker-account-id-和-api-token) 确保获取的 Account ID 和 API token 正确，对于 API token，请确保拥有对应的权限。

2. 检查 Github Action 中的环境变量是否符合预期，特别是 `ACCOUNT_ID` 和 `API_TOKEN`。

3. 如果你认为上面两点都没有问题，那么请提交 Issue，并附上你的 Worker 的完整部署日志。

---

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
