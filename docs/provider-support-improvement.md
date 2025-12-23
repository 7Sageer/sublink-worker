# Provider Support Improvement

## 概述

本文档描述了 Sublink Worker 中 `proxy-providers`（Clash）和 `outbound_providers`（Sing-Box）功能的当前实现状态、存在的问题以及改进方案。

---

## 当前实现状态

### 自动检测机制

当前系统已实现**自动检测订阅格式并智能选择 provider 模式**：

1. 当用户提供 HTTP(S) 订阅 URL 时，系统会检测订阅内容的格式
2. 如果格式与目标客户端兼容（Clash YAML → Clash，Sing-Box JSON → Sing-Box），则将 URL 作为 provider 使用
3. 如果格式不兼容，则解析内容并转换代理节点

### 相关代码位置

| 文件 | 功能 |
|------|------|
| `src/builders/BaseConfigBuilder.js` | 基类，管理 `providerUrls` 收集和格式检测 |
| `src/builders/ClashConfigBuilder.js` | Clash 配置生成，`proxy-providers` 实现 |
| `src/builders/SingboxConfigBuilder.js` | Sing-Box 配置生成，`outbound_providers` 实现 |
| `src/parsers/subscription/subscriptionContentParser.js` | 订阅内容解析，提取 config overrides |

---

## 存在的问题

### 问题 1：Sing-Box outbound_providers 被覆盖而非合并

**现象**：当用户输入的 Sing-Box JSON 配置中已包含 `outbound_providers` 时，如果同时存在被检测为兼容格式的 HTTP 订阅，用户定义的 providers 会被完全覆盖。

**代码位置**：`SingboxConfigBuilder.js:291-294`

```javascript
// 当前实现 - 直接覆盖
if (this.providerUrls.length > 0) {
    this.config.outbound_providers = this.generateOutboundProviders();
}
```

**对比 Clash 实现**：`ClashConfigBuilder.js:443-448`

```javascript
// Clash 实现 - 合并
if (this.providerUrls.length > 0) {
    this.config['proxy-providers'] = {
        ...this.config['proxy-providers'],  // 保留已有的
        ...this.generateProxyProviders()
    };
}
```

**期望行为**：应该合并用户定义的 providers 和系统检测到的 providers。

---

### 问题 2：系统生成的 proxy-groups 不引用用户定义的 providers

**现象**：当用户输入的配置中包含自定义 providers 时，系统生成的 proxy-groups（如"节点选择"、"自动选择"）不会自动引用这些 providers。

**示例场景**：

用户输入的 Clash YAML：
```yaml
proxy-providers:
  my-provider:
    type: http
    url: https://example.com/my-sub
    path: ./providers/my.yaml
    interval: 3600

proxies:
  - name: local-node
    type: ss
    server: 127.0.0.1
    port: 1080
    cipher: aes-256-gcm
    password: test
```

当前输出：
```yaml
proxy-providers:
  my-provider:  # 用户定义的 provider 被保留
    type: http
    url: https://example.com/my-sub
    ...

proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - ⚡ 自动选择
      - local-node
    # 缺少: use: [my-provider]  ← 问题所在
```

**期望行为**：系统生成的 proxy-groups 应该同时引用：
1. 用户定义的 providers（来自输入配置）
2. 系统检测到的 providers（来自 `providerUrls`）

---

### 问题 3：用户定义的 proxy-groups 中的 provider 引用可能失效

**现象**：用户在输入配置中定义的 proxy-groups 可能引用了特定的 providers，但如果这些 groups 被系统重新生成，引用关系会丢失。

**示例**：

用户输入：
```yaml
proxy-groups:
  - name: 🚀 节点选择
    type: select
    use:
      - my-provider-1
      - my-provider-2
    proxies:
      - DIRECT
```

由于"节点选择"是系统会生成的标准 group，可能会被覆盖或重新创建，导致 `use` 字段丢失。

**相关代码**：`ClashConfigBuilder.js:289-314` 中的 `addNodeSelectGroup` 方法会检查是否已存在同名 group，但不会合并 `use` 字段。

---

### 问题 4：缺少对 provider 节点的健康检查和过滤支持

**现象**：当使用 providers 时，无法对 provider 中的节点进行：
- 按国家/地区分组
- 节点去重
- 自定义过滤

**原因**：provider 中的节点是运行时由客户端获取的，Sublink Worker 在生成配置时无法访问这些节点。

**这是一个设计限制**，而非 bug。但可以考虑提供文档说明或 UI 提示。

---

### 问题 5：Provider 名称冲突风险

**现象**：当用户定义的 provider 与系统自动生成的 provider 使用相同名称时，用户的 provider 会被覆盖。

**代码位置**：`ClashConfigBuilder.js:443-448`

```javascript
this.config['proxy-providers'] = {
    ...this.config['proxy-providers'],  // 用户的 provider
    ...this.generateProxyProviders()     // 系统生成的（后者覆盖前者）
};
```

**问题场景**：系统生成的 provider 使用 `provider1`, `provider2` 等命名。如果用户恰好也使用这些名称，会被覆盖。

**期望行为**：
1. 系统生成的 provider 应使用不易冲突的前缀（如 `_auto_provider1`）
2. 或者检测冲突并自动重命名

---

### 问题 6：sanitizeClashProxyGroups 错误移除 provider 节点引用

**现象**：当 proxy-groups 的 `proxies` 字段中包含来自 provider 的节点名称时，这些引用会被 sanitizer 错误移除。

**代码位置**：`src/builders/helpers/clashConfigUtils.js:51-75`

```javascript
export function sanitizeClashProxyGroups(config) {
    // 只认 config.proxies 中的节点为有效
    const proxyNames = new Set((config.proxies || []).map(p => normalize(p?.name)).filter(Boolean));
    // ...
    // 过滤 group.proxies，移除不在 validNames 中的引用
}
```

**问题原因**：provider 中的节点不在 `config.proxies` 数组中，sanitizer 会将其视为无效引用并移除。

**期望行为**：sanitizer 应该跳过使用了 `use` 字段的 groups，或者不过滤这些 groups 的 `proxies` 字段。

---

### 问题 7：多订阅源的 config override 互相覆盖

**现象**：当用户提供多个订阅 URL，且每个订阅都包含配置（如 DNS 设置）时，后面的订阅会完全覆盖前面的配置。

**代码位置**：`BaseConfigBuilder.js:103-106`

```javascript
if (result.config) {
    this.applyConfigOverrides(result.config);  // 每次都是覆盖，不是合并
}
```

**问题场景**：
- 订阅 A 提供 DNS 配置：`nameserver: [8.8.8.8]`
- 订阅 B 提供 DNS 配置：`nameserver: [1.1.1.1]`
- 最终结果只有 `[1.1.1.1]`，而非合并

**期望行为**：对于数组类型的配置（如 `nameserver`），应该合并而非覆盖；或者提供合并策略选项。

---

### 问题 8：Sing-Box 输入的 groups 结构丢失

**现象**：当用户输入 Sing-Box JSON 配置时，其中的 selector/urltest outbounds 会被转换为 Clash `proxy-groups` 格式存储，但 `SingboxConfigBuilder` 不使用这些转换后的 groups，而是重新生成。

**代码位置**：`subscriptionContentParser.js:35-43`

```javascript
// Sing-Box selector/urltest 被转换为 Clash proxy-groups 格式
// 但 SingboxConfigBuilder 不使用这些
```

**问题场景**：用户精心配置的 Sing-Box 分组结构会丢失，被系统默认的分组替代。

**期望行为**：保留用户定义的 Sing-Box outbound 分组结构。

---

### 问题 9：用户 proxy-groups 中的无效引用无验证

**现象**：用户提供的 `proxy-groups` 可能引用不存在的 provider 名称，这些无效引用会被保留到最终配置中。

**问题场景**：

```yaml
proxy-groups:
  - name: My Group
    type: select
    use:
      - non-existent-provider  # 不存在的 provider
    proxies:
      - also-not-exist  # 不存在的节点
```

**当前行为**：
- `proxies` 中的无效引用会被 `sanitizeClashProxyGroups` 移除
- `use` 中的无效 provider 引用不会被验证，保留到最终配置

**期望行为**：验证 `use` 字段中的 provider 引用，移除或警告无效引用。

---

## 解决方案

### 方案 1：修复 Sing-Box outbound_providers 合并逻辑

**修改文件**：`src/builders/SingboxConfigBuilder.js`

**修改内容**：

```javascript
// 修改 formatConfig() 方法中的 outbound_providers 处理
if (this.providerUrls.length > 0) {
    const existingProviders = this.config.outbound_providers || [];
    const newProviders = this.generateOutboundProviders();
    this.config.outbound_providers = [...existingProviders, ...newProviders];
}
```

**注意事项**：
- 需要处理 provider tag 冲突（如果用户定义的 provider 和系统生成的 provider 同名）
- 建议系统生成的 provider 使用 `_auto_provider1` 等前缀避免冲突

---

### 方案 2：系统生成的 groups 自动引用所有 providers

**修改文件**：
- `src/builders/ClashConfigBuilder.js`
- `src/builders/SingboxConfigBuilder.js`

**实现思路**：

1. 在 `BaseConfigBuilder` 中添加方法获取所有 provider names：

```javascript
// BaseConfigBuilder.js
getAllProviderNames() {
    // 子类实现
    throw new Error('getAllProviderNames must be implemented in child class');
}
```

2. 在 `ClashConfigBuilder` 中实现：

```javascript
getAllProviderNames() {
    const existingProviders = Object.keys(this.config['proxy-providers'] || {});
    const autoProviders = this.getProviderNames();
    return [...new Set([...existingProviders, ...autoProviders])];
}
```

3. 修改 `addAutoSelectGroup` 和 `addNodeSelectGroup` 使用 `getAllProviderNames()`：

```javascript
addAutoSelectGroup(proxyList) {
    // ...existing code...

    const allProviderNames = this.getAllProviderNames();
    if (allProviderNames.length > 0) {
        group.use = allProviderNames;
    }

    // ...
}
```

---

### 方案 3：保留用户定义的 proxy-groups 中的 provider 引用

**修改文件**：
- `src/builders/ClashConfigBuilder.js`
- `src/builders/SingboxConfigBuilder.js`

**实现思路**：

在添加系统 group 之前，检查是否已存在同名 group，如果存在则合并而非跳过：

```javascript
addNodeSelectGroup(proxyList) {
    const nodeName = this.t('outboundNames.Node Select');
    const existingGroup = this.config['proxy-groups']?.find(g => g.name === nodeName);

    if (existingGroup) {
        // 合并而非跳过
        const allProviderNames = this.getAllProviderNames();
        if (allProviderNames.length > 0) {
            existingGroup.use = [...new Set([
                ...(existingGroup.use || []),
                ...allProviderNames
            ])];
        }
        // 合并 proxies
        const newProxies = buildNodeSelectMembers({...});
        existingGroup.proxies = [...new Set([
            ...(existingGroup.proxies || []),
            ...newProxies
        ])];
        return;
    }

    // ...create new group...
}
```

---

### 方案 4：添加 provider 相关的 UI 提示和文档

**内容**：

1. 在 UI 中添加提示：当检测到输入配置包含 providers 时，显示说明
2. 文档说明 provider 模式的限制（无法按国家分组等）
3. 提供手动控制是否使用 provider 模式的选项（可选）

---

### 方案 5：避免 Provider 名称冲突

**修改文件**：
- `src/builders/ClashConfigBuilder.js`
- `src/builders/SingboxConfigBuilder.js`

**实现思路**：

1. 系统生成的 provider 使用带前缀的命名：

```javascript
generateProxyProviders() {
    return this.providerUrls.reduce((acc, url, index) => {
        const providerName = `_auto_provider_${index + 1}`;  // 使用前缀避免冲突
        acc[providerName] = {
            type: 'http',
            url: url,
            // ...
        };
        return acc;
    }, {});
}
```

2. 或者检测冲突并自动重命名：

```javascript
generateProxyProviders() {
    const existingNames = new Set(Object.keys(this.config['proxy-providers'] || {}));
    return this.providerUrls.reduce((acc, url, index) => {
        let providerName = `provider${index + 1}`;
        while (existingNames.has(providerName)) {
            providerName = `_${providerName}`;  // 添加前缀直到不冲突
        }
        existingNames.add(providerName);
        acc[providerName] = { /* ... */ };
        return acc;
    }, {});
}
```

---

### 方案 6：修复 sanitizeClashProxyGroups 对 provider 的支持

**修改文件**：`src/builders/helpers/clashConfigUtils.js`

**实现思路**：

```javascript
export function sanitizeClashProxyGroups(config) {
    const proxyNames = new Set((config.proxies || []).map(p => normalize(p?.name)).filter(Boolean));
    const groupNames = new Set(groups.map(g => normalize(g?.name)).filter(Boolean));
    const validNames = new Set(['DIRECT', 'REJECT'].map(normalize));
    proxyNames.forEach(n => validNames.add(n));
    groupNames.forEach(n => validNames.add(n));

    groups.forEach(group => {
        // 如果 group 使用了 providers，跳过 proxies 过滤
        // 因为 provider 中的节点名称在配置生成时未知
        if (group.use && group.use.length > 0) {
            return;  // 跳过使用 provider 的 group
        }

        if (Array.isArray(group.proxies)) {
            group.proxies = group.proxies.filter(p => validNames.has(normalize(p)));
        }
    });
}
```

---

### 方案 7：智能合并多订阅源的 config override

**修改文件**：`src/builders/BaseConfigBuilder.js`

**实现思路**：

```javascript
applyConfigOverrides(overrides) {
    const blacklistedKeys = new Set(['proxies', 'rules', 'rule-providers']);
    // 需要合并而非覆盖的数组字段
    const mergeableArrayKeys = new Set(['nameserver', 'fallback', 'fake-ip-filter']);

    Object.entries(overrides).forEach(([key, value]) => {
        if (blacklistedKeys.has(key)) {
            return;
        }

        if (value === undefined) {
            delete this.config[key];
        } else if (mergeableArrayKeys.has(key) && Array.isArray(value) && Array.isArray(this.config[key])) {
            // 合并数组，去重
            this.config[key] = [...new Set([...this.config[key], ...value])];
        } else {
            this.config[key] = deepCopy(value);
        }
        this.appliedOverrideKeys.add(key);
    });
}
```

**注意事项**：
- 需要明确定义哪些字段应该合并
- 对于嵌套对象（如 `dns`），可能需要深度合并策略
- 可以考虑提供配置选项让用户选择合并策略

---

### 方案 8：保留 Sing-Box 输入的 groups 结构

**修改文件**：
- `src/parsers/subscription/subscriptionContentParser.js`
- `src/builders/SingboxConfigBuilder.js`

**实现思路**：

1. 在解析时保留原始 Sing-Box outbounds 结构：

```javascript
// subscriptionContentParser.js
function parseSingboxJson(content) {
    // ...
    return {
        type: 'singboxConfig',
        proxies,
        config: {
            ...configWithoutOutbounds,
            // 保留 selector/urltest outbounds 的原始结构
            _singboxGroups: selectorAndUrltestOutbounds
        }
    };
}
```

2. 在 SingboxConfigBuilder 中使用保留的结构：

```javascript
// SingboxConfigBuilder.js
build() {
    // ...
    if (this.config._singboxGroups && this.config._singboxGroups.length > 0) {
        // 使用用户定义的 groups 结构
        this.mergeUserDefinedGroups(this.config._singboxGroups);
        delete this.config._singboxGroups;
    }
    // ...
}
```

---

## 实现优先级

| 优先级 | 问题 | 方案 | 复杂度 |
|--------|------|------|--------|
| P0 | Sing-Box providers 被覆盖 | 方案 1 | 低 |
| P0 | sanitizer 错误移除 provider 节点 | 方案 6 | 低 |
| P1 | Groups 不引用用户 providers | 方案 2 | 中 |
| P1 | Provider 名称冲突 | 方案 5 | 低 |
| P2 | 用户 groups 的 use 字段丢失 | 方案 3 | 中 |
| P2 | Sing-Box groups 结构丢失 | 方案 8 | 中 |
| P3 | 多订阅 override 互相覆盖 | 方案 7 | 中 |
| P3 | 缺少文档和提示 | 方案 4 | 低 |
| P4 | 无效 provider 引用无验证 | - | 低 |
| - | Provider 节点无法过滤 | - | 设计限制 |

---

## 测试用例

### 测试 1：Sing-Box providers 合并

**输入**：
```json
{
  "outbound_providers": [
    { "tag": "user-provider", "type": "http", "download_url": "https://user.example.com/sub" }
  ],
  "outbounds": [
    { "type": "shadowsocks", "tag": "node1", "server": "1.2.3.4", "server_port": 443, "method": "aes-256-gcm", "password": "test" }
  ]
}
```

加上 HTTP 订阅 URL：`https://auto.example.com/singbox-sub`（返回 Sing-Box 格式）

**期望输出**：
```json
{
  "outbound_providers": [
    { "tag": "user-provider", "type": "http", "download_url": "https://user.example.com/sub", ... },
    { "tag": "provider1", "type": "http", "download_url": "https://auto.example.com/singbox-sub", ... }
  ],
  "outbounds": [
    {
      "type": "selector",
      "tag": "🚀 节点选择",
      "providers": ["user-provider", "provider1"],
      "outbounds": ["⚡ 自动选择", "node1"]
    },
    ...
  ]
}
```

### 测试 2：Clash proxy-providers 引用

**输入**：
```yaml
proxy-providers:
  my-provider:
    type: http
    url: https://example.com/sub
    path: ./my.yaml
    interval: 3600

proxies:
  - name: local
    type: ss
    server: 127.0.0.1
    port: 1080
    cipher: aes-256-gcm
    password: test
```

**期望输出**：
```yaml
proxy-providers:
  my-provider:
    type: http
    url: https://example.com/sub
    ...

proxy-groups:
  - name: 🚀 节点选择
    type: select
    use:
      - my-provider  # 应该包含用户定义的 provider
    proxies:
      - ⚡ 自动选择
      - local
```

### 测试 3：用户 proxy-groups 的 use 字段保留

**输入**：
```yaml
proxy-providers:
  provider-a:
    type: http
    url: https://a.example.com/sub
    path: ./a.yaml

proxy-groups:
  - name: 🚀 节点选择
    type: select
    use:
      - provider-a
    proxies:
      - DIRECT

proxies: []
```

**期望输出**：
```yaml
proxy-groups:
  - name: 🚀 节点选择
    type: select
    use:
      - provider-a  # 保留用户定义的引用
    proxies:
      - ⚡ 自动选择
      - DIRECT
      - 🎯 全球直连
      # ... 其他系统添加的选项
```

### 测试 4：Provider 名称冲突处理

**输入**：
```yaml
proxy-providers:
  provider1:  # 用户使用了与系统相同的命名
    type: http
    url: https://user.example.com/sub
    path: ./user.yaml

proxies: []
```

加上 HTTP 订阅 URL：`https://auto.example.com/clash-sub`（返回 Clash 格式）

**期望输出**：
```yaml
proxy-providers:
  provider1:  # 用户的 provider 保留
    type: http
    url: https://user.example.com/sub
    ...
  _auto_provider_1:  # 系统生成的使用不同名称
    type: http
    url: https://auto.example.com/clash-sub
    ...
```

### 测试 5：sanitizer 不移除 provider 节点引用

**输入**：
```yaml
proxy-providers:
  my-provider:
    type: http
    url: https://example.com/sub
    path: ./my.yaml

proxy-groups:
  - name: Custom Group
    type: select
    use:
      - my-provider
    proxies:
      - node-from-provider  # 来自 provider 的节点名称

proxies: []
```

**期望输出**：
```yaml
proxy-groups:
  - name: Custom Group
    type: select
    use:
      - my-provider
    proxies:
      - node-from-provider  # 不应被移除
```

### 测试 6：多订阅源 DNS 配置合并

**输入订阅 A**：
```yaml
dns:
  nameserver:
    - 8.8.8.8
proxies:
  - name: node-a
    ...
```

**输入订阅 B**：
```yaml
dns:
  nameserver:
    - 1.1.1.1
proxies:
  - name: node-b
    ...
```

**期望输出**：
```yaml
dns:
  nameserver:
    - 8.8.8.8  # 来自订阅 A
    - 1.1.1.1  # 来自订阅 B（合并而非覆盖）
proxies:
  - name: node-a
  - name: node-b
```

### 测试 7：Sing-Box 输入 groups 结构保留

**输入**：
```json
{
  "outbounds": [
    {
      "type": "selector",
      "tag": "My Custom Selector",
      "outbounds": ["auto-group", "node1"]
    },
    {
      "type": "urltest",
      "tag": "auto-group",
      "outbounds": ["node1"],
      "interval": "5m"
    },
    {
      "type": "shadowsocks",
      "tag": "node1",
      "server": "1.2.3.4",
      "server_port": 443,
      "method": "aes-256-gcm",
      "password": "test"
    }
  ]
}
```

**期望输出**：
```json
{
  "outbounds": [
    {
      "type": "selector",
      "tag": "My Custom Selector",  // 保留用户定义的 selector
      "outbounds": ["auto-group", "node1"]
    },
    {
      "type": "urltest",
      "tag": "auto-group",  // 保留用户定义的 urltest
      "outbounds": ["node1"],
      "interval": "5m"
    },
    // ... 系统添加的其他 outbounds
  ]
}
```

---

## 相关文件清单

```
src/builders/
├── BaseConfigBuilder.js      # 基类，需添加 getAllProviderNames 方法，修改 applyConfigOverrides 合并策略
├── ClashConfigBuilder.js     # Clash 实现，需修改 group 生成逻辑，避免 provider 名称冲突
├── SingboxConfigBuilder.js   # Sing-Box 实现，需修复 providers 合并，保留用户 groups 结构
└── helpers/
    └── clashConfigUtils.js   # sanitizeClashProxyGroups 需支持 provider 节点引用

src/parsers/subscription/
└── subscriptionContentParser.js  # 需保留 Sing-Box 原始 groups 结构

test/
├── proxy-providers.test.js   # 需添加新测试用例
├── clash-builder.test.js     # 需添加 provider 相关测试
└── singbox-input-parsing.test.js  # 需添加 groups 保留测试
```

---

## 变更影响评估

### 向后兼容性

- **方案 1**：完全向后兼容，只是修复了覆盖问题
- **方案 2**：向后兼容，只是增加了 `use`/`providers` 字段
- **方案 3**：可能影响依赖当前行为的用户（如果有的话）
- **方案 5**：向后兼容，系统生成的 provider 名称变化不影响功能
- **方案 6**：向后兼容，只是减少了错误的过滤行为
- **方案 7**：可能影响依赖覆盖行为的用户，建议提供配置选项
- **方案 8**：向后兼容，只是增加了对用户 groups 的保留

### 性能影响

- 无显著性能影响，只是增加了一些数组操作
- 方案 7 的深度合并可能略微增加处理时间，但影响可忽略

### 测试覆盖

- 需要更新 `test/proxy-providers.test.js` 添加新测试用例
- 需要更新 `test/clash-builder.test.js` 添加 provider 名称冲突和 sanitizer 测试
- 需要更新 `test/singbox-input-parsing.test.js` 添加 groups 保留测试
- 建议添加集成测试验证完整流程
- 建议添加多订阅源合并的测试用例
