# 本地测试指南

## 🚀 快速开始

```bash
# 1. 安装依赖（如果还没有）
npm install

# 2. 运行测试
node test-local.js
```

## 📊 测试用例说明

测试脚本包含以下测试用例：

1. **原始 YAML 配置测试** - 验证 GitHub Gist 示例能否正确解析出 HY2/TUIC/VLESS 节点
2. **空代理数组测试** - 确认 `proxies: []` 时不会产生节点
3. **混合类型与无效节点** - 仅返回受支持协议，忽略未知类型
4. **Base64 编码 YAML** - 验证 Base64 包裹的 Clash YAML 能被解码并解析

## 🎯 预期结果

- ✅ 所有测试通过：YAML 解析功能正常工作
- ⚠️ 部分失败：需要检查具体实现

## 📋 测试输出示例

```
🧪 测试: 原始 YAML 配置测试
📝 输入: [您的 YAML 配置内容]
📊 解析结果: 3 个代理节点
✅ 测试结果: 通过
  1. HY2-main (hysteria2)
  2. TUIC-main (tuic)
  3. VLESS-REALITY (vless)
```

## 🔧 故障排除

如果测试失败，请检查：
1. Node.js 版本是否兼容
2. 依赖是否正确安装
3. 测试脚本是否在正确目录运行

---

**准备好测试了吗？** 运行 `node test-local.js` 来验证您的 YAML 解析功能！
