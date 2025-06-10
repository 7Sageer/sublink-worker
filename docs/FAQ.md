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

### 为什么我的订阅配置校验失败，提示 `duplicate group name`？

**问题现象：**

在 Clash 订阅配置校验时，可能会遇到类似以下错误信息：

```
yaml
proxy-groups:
   - name: 新加坡优选
     type: url-test
     proxies: []
     url: `https://www.gstatic.com/generate_204`
     interval: 300
     lazy: false
   - name: 新加坡优选
     type: url-test
     proxies:
       - 🇸🇬AWS新加坡01 | 高速专线推荐
       # ... 其他代理
     url: `https://www.gstatic.com/generate_204`
     interval: 300
     lazy: false
# ...
level=error msg="ProxyGroup 新加坡优选: duplicate group name" configuration file C:\Users\Administrator\AppData\Roaming\io.github.clash-verge-rev.clash-verge-rev\clash-verge-check.yaml test failed
```

这表明在生成的 Clash 配置文件中，存在两个或多个名为“新加坡优选”的代理组，导致配置校验失败。

**原因：**

此问题通常是由于代码中对 `addSingaporeAutoSelectGroup` 方法的重复调用引起的。在 `src/BaseConfigBuilder.js` 的 `addSelectors` 方法中已经包含了对 `addSingaporeAutoSelectGroup` 的调用，但 `src/index.js` 中可能存在额外的、冗余的调用，从而导致代理组被重复添加。

**解决方案：**

1.  **移除 `src/index.js` 中的重复调用：**
    打开 `src/index.js` 文件，找到类似以下的代码块：

    ```javascript
    if (configBuilder instanceof ClashConfigBuilder) {
      configBuilder.addSingaporeAutoSelectGroup(configBuilder.getProxies().map(p => p.name));
    }
    ```

    将其删除或注释掉。因为 `addSingaporeAutoSelectGroup` 已经在 `BaseConfigBuilder.js` 的 `addSelectors` 方法中被正确调用，所以这里的额外调用是多余的。

2.  **确保代理组名称动态化：**
    检查 `src/ClashConfigBuilder.js` 文件中的 `addSingaporeAutoSelectGroup` 方法，确保代理组的 `name` 字段是通过国际化函数 `t('outboundNames.Singapore Auto Select')` 获取的，而不是硬编码的字符串。这有助于避免因硬编码导致的名称冲突。

    ```javascript
    // src/ClashConfigBuilder.js
    addSingaporeAutoSelectGroup(proxyList) {
        // ...
        this.config['proxy-groups'].push({
            name: t('outboundNames.Singapore Auto Select'), // 确保使用国际化名称
            // ...
        });
    }
    ```

3.  **调整代理列表回退逻辑：**
    在 `src/ClashConfigBuilder.js` 的 `addSingaporeAutoSelectGroup` 方法中，如果筛选出的新加坡代理列表为空，确保回退逻辑是使用所有代理的深拷贝 (`DeepCopy(proxyList)`)，而不是 `['DIRECT']`。这能保证即使没有新加坡节点，该代理组也能包含所有可用节点，与“自动选择”代理组的行为保持一致。

    ```javascript
    // src/ClashConfigBuilder.js
    addSingaporeAutoSelectGroup(proxyList) {
        let proxiesForGroup = DeepCopy(proxyList).filter(proxy => proxy.includes('🇸🇬'));
        if (proxiesForGroup.length === 0) {
            proxiesForGroup = DeepCopy(proxyList); // 回退到所有代理
        }
        // ...
    }
    ```

完成上述修改后，重新生成订阅配置，`duplicate group name` 的错误应该会得到解决。

---

### 如何新建一个筛选节点的自动优选代理组？

如果你想创建一个新的自动优选代理组，例如一个只包含日本节点的代理组，可以按照以下步骤进行：

**1. 在 `i18n/index.js` 中定义代理组名称：**

首先，在 `src/i18n/index.js` 文件的 `outboundNames` 对象中，为你的新代理组添加一个名称。例如，添加“日本优选”：

```javascript
// src/i18n/index.js
outboundNames: {
  // ... 现有名称
  'Japan Auto Select': '🇯🇵 日本优选',
}
```

**2. 在 `ClashConfigBuilder.js` 中创建代理组方法：**

在 `src/ClashConfigBuilder.js` 文件中，参考 `addSingaporeAutoSelectGroup` 方法，创建一个新的方法，例如 `addJapanAutoSelectGroup`。在这个方法中，你需要根据你的需求筛选代理列表。例如，筛选包含“🇯🇵”的代理：

```javascript
// src/ClashConfigBuilder.js
addJapanAutoSelectGroup(proxyList) {
    let proxiesForGroup = DeepCopy(proxyList).filter(proxy => proxy.includes('🇯🇵'));
    if (proxiesForGroup.length === 0) {
        // 如果没有日本节点，可以回退到所有代理，或者 DIRECT
        proxiesForGroup = DeepCopy(proxyList); // 或者 proxiesForGroup = ['DIRECT'];
    }

    this.config['proxy-groups'] = this.config['proxy-groups'] || [];
    this.config['proxy-groups'].push({
        name: t('outboundNames.Japan Auto Select'), // 使用国际化名称
        type: 'url-test',
        proxies: proxiesForGroup,
        url: 'https://www.gstatic.com/generate_204',
        interval: 300,
        lazy: false
    });
}
```

**3. 在 `BaseConfigBuilder.js` 的 `addSelectors` 中调用新方法：**

在 `src/BaseConfigBuilder.js` 文件的 `addSelectors` 方法中，调用你刚刚创建的新代理组方法。确保调用顺序合理，例如放在 `addSingaporeAutoSelectGroup` 之后：

```javascript
// src/BaseConfigBuilder.js
addSelectors() {
    const outbounds = this.getOutboundsList();
    const proxyList = this.getProxyList();

    this.addSingaporeAutoSelectGroup(proxyList);
    this.addJapanAutoSelectGroup(proxyList); // 添加你的新方法
    this.addAutoSelectGroup(proxyList);
    this.addNodeSelectGroup(proxyList);
    this.addOutboundGroups(outbounds, proxyList);
    this.addCustomRuleGroups(proxyList);
    this.addFallBackGroup(proxyList);
}
```

**4. 在 `ClashConfigBuilder.js` 中实现 `addJapanAutoSelectGroup` 方法：**

由于 `BaseConfigBuilder.js` 中的 `addJapanAutoSelectGroup` 是一个抽象方法（通过 `throw new Error` 定义），你需要在 `src/ClashConfigBuilder.js` 中实现它：

```javascript
// src/ClashConfigBuilder.js
// ... 其他方法

addJapanAutoSelectGroup(proxyList) {
    // 实现与 addSingaporeAutoSelectGroup 类似，但筛选条件为日本节点
    let proxiesForGroup = DeepCopy(proxyList).filter(proxy => proxy.includes('🇯🇵'));
    if (proxiesForGroup.length === 0) {
        proxiesForGroup = DeepCopy(proxyList);
    }

    this.config['proxy-groups'].push({
        name: t('outboundNames.Japan Auto Select'),
        type: 'url-test',
        proxies: proxiesForGroup,
        url: 'https://www.gstatic.com/generate_204',
        interval: 300,
        lazy: false
    });
}
```

**5. 更新 `addNodeSelectGroup` (可选)：**

如果你希望新的代理组也出现在“节点选择”组中，你需要在 `src/ClashConfigBuilder.js` 的 `addNodeSelectGroup` 方法中将其添加到 `proxyList.unshift` 中：

```javascript
// src/ClashConfigBuilder.js
addNodeSelectGroup(proxyList) {
    proxyList.unshift('DIRECT', 'REJECT', t('outboundNames.Auto Select'), t('outboundNames.Singapore Auto Select'), t('outboundNames.Japan Auto Select')); // 添加新的代理组名称
    // ...
}
```

完成以上步骤后，重新生成订阅配置，你就会看到一个新的“日本优选”代理组。

### 如何新建一个筛选美国节点的自动优选代理组？

如果你想创建一个新的自动优选代理组，例如一个只包含美国节点的代理组，可以按照以下步骤进行：

**1. 在 `i18n/index.js` 中定义代理组名称：**

首先，在 `src/i18n/index.js` 文件的 `outboundNames` 对象中，为你的新代理组添加一个名称。例如，添加“美国优选”：

```javascript
// src/i18n/index.js
outboundNames: {
  // ... 现有名称
  'US Auto Select': '🇺🇸 美国优选',
}
```

**2. 在 `ClashConfigBuilder.js` 中创建代理组方法：**

在 `src/ClashConfigBuilder.js` 文件中，参考 `addSingaporeAutoSelectGroup` 方法，创建一个新的方法，例如 `addUSAutoSelectGroup`。在这个方法中，你需要根据你的需求筛选代理列表。例如，筛选包含“🇺🇸”的代理：

```javascript
// src/ClashConfigBuilder.js
addUSAutoSelectGroup(proxyList) {
    let proxiesForGroup = DeepCopy(proxyList).filter(proxy => proxy.includes('🇺🇸'));
    if (proxiesForGroup.length === 0) {
        // 如果没有美国节点，可以回退到所有代理，或者 DIRECT
        proxiesForGroup = DeepCopy(proxyList); // 或者 proxiesForGroup = ['DIRECT'];
    }

    this.config['proxy-groups'] = this.config['proxy-groups'] || [];
    this.config['proxy-groups'].push({
        name: t('outboundNames.US Auto Select'), // 使用国际化名称
        type: 'url-test',
        proxies: proxiesForGroup,
        url: 'https://www.gstatic.com/generate_204',
        interval: 300,
        lazy: false
    });
}
```

**3. 在 `BaseConfigBuilder.js` 的 `addSelectors` 中调用新方法：**

在 `src/BaseConfigBuilder.js` 文件的 `addSelectors` 方法中，调用你刚刚创建的新代理组方法。确保调用顺序合理，例如放在 `addJapanAutoSelectGroup` 之后：

```javascript
// src/BaseConfigBuilder.js
addSelectors() {
    const outbounds = this.getOutboundsList();
    const proxyList = this.getProxyList();

    this.addSingaporeAutoSelectGroup(proxyList);
    this.addJapanAutoSelectGroup(proxyList);
    this.addUSAutoSelectGroup(proxyList); // 添加你的新方法
    this.addAutoSelectGroup(proxyList);
    this.addNodeSelectGroup(proxyList);
    this.addOutboundGroups(outbounds, proxyList);
    this.addCustomRuleGroups(proxyList);
    this.addFallBackGroup(proxyList);
}
```

**4. 在 `ClashConfigBuilder.js` 中实现 `addUSAutoSelectGroup` 方法：**

由于 `BaseConfigBuilder.js` 中的 `addUSAutoSelectGroup` 是一个抽象方法（通过 `throw new Error` 定义），你需要在 `src/ClashConfigBuilder.js` 中实现它：

```javascript
// src/ClashConfigBuilder.js
// ... 其他方法

addUSAutoSelectGroup(proxyList) {
    // 实现与 addSingaporeAutoSelectGroup 类似，但筛选条件为美国节点
    let proxiesForGroup = DeepCopy(proxyList).filter(proxy => proxy.includes('🇺🇸'));
    if (proxiesForGroup.length === 0) {
        proxiesForGroup = DeepCopy(proxyList);
    }

    this.config['proxy-groups'].push({
        name: t('outboundNames.US Auto Select'),
        type: 'url-test',
        proxies: proxiesForGroup,
        url: 'https://www.gstatic.com/generate_204',
        interval: 300,
        lazy: false
    });
}
```

**5. 更新 `addNodeSelectGroup` (可选)：**

如果你希望新的代理组也出现在“节点选择”组中，你需要在 `src/ClashConfigBuilder.js` 的 `addNodeSelectGroup` 方法中将其添加到 `proxyList.unshift` 中：

```javascript
// src/ClashConfigBuilder.js
addNodeSelectGroup(proxyList) {
    proxyList.unshift('DIRECT', 'REJECT', t('outboundNames.Auto Select'), t('outboundNames.Singapore Auto Select'), t('outboundNames.Japan Auto Select'), t('outboundNames.US Auto Select')); // 添加新的代理组名称
    // ...
}
```
