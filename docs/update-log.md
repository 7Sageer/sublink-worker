# 更新日志

## 2024-12-07

- 确保在手动选择规则时，预定义规则集的选择框也会自动更新为 "custom"

## 2024-11-30

- 添加对 Shadowsocks 旧式 URL 的支持

## 2024-11-23

- Bug修复：
  - 重复点击生成按钮时，可能导致无法访问短链

## 2024-11-20

- 修复sing-box配置初次下载过慢的问题

## 2024-11-19

- 改进了整体UI交互体验，提升了操作流畅度

## 2024-11-05

- [新功能] 现在可以保存自定义基础配置
- 优化了UI

## 2024-10-15

- 添加了[FAQ文档](/doc/FAQ.md)

## 2024-10-03

- 现在可以保存并管理自定义短链接

## 2024-09-28

- ([#41](https://github.com/7Sageer/sublink-worker/pull/41)) (by [@Wikeolf](https://github.com/Wikeolf))
  - 添加自定义域名关键词支持
  - 现在可以决定自定义规则的顺序

## 2024-09-23

- ([#37](https://github.com/7Sageer/sublink-worker/issues/37)) 修复了VMess和Shadowsocks url中文可能出现乱码的问题

## 2024-09-20

- 在公共站点启用新域名(https://sublink-worker.sageer.me)

## 2024-09-18

- ([#35](https://github.com/7Sageer/sublink-worker/issues/35)) 确保Vmess转换时security选项存在
- 修复了默认配置缺乏出站的问题

## 2024-09-15

- ([#31](https://github.com/7Sageer/sublink-worker/issues/31),[#25](https://github.com/7Sageer/sublink-worker/issues/25)) 现在可以自定义短链接路径
- 优化了前端显示，简化操作流程

## 2024-09-13

- ([#27](https://github.com/7Sageer/sublink-worker/issues/27)) 优化了出站选择排布

## 2024-09-10

- ([#25](https://github.com/7Sageer/sublink-worker/issues/25)) 修复了Base64无法转换多个HTTP的问题
- 现在为生成的链接提供二维码

## 2024-09-09

- ([#23](https://github.com/7Sageer/sublink-worker/issues/23)) 修复了Github规则无效的问题

## 2024-09-07

- ([#16](https://github.com/7Sageer/sublink-worker/issues/16)) 修复了导入base64订阅时出现乱码的问题

## 2024-09-03

- `📚 教育资源` 现在添加了 `geosite-category-scholar-!cn` 规则

## 2024-09-02

- 现在使用 KV 存储短链接，不再依赖 R2

## 2024-09-01

- 自定义规则现在支持以下规则：
  - domain_suffix
  - ip_cidr
  - geoip
  - geosite

## 2024-08-25

- 修复 ClashMeta For Android 高于[v2.10.1]版本不显示规则集的问题

## 2024-08-20

- 新增：
  - 自定义规则
  - 自定义规则的 API 支持，详见 [API-doc.md](/doc/API-doc.md)