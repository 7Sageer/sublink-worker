# 更新日志

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