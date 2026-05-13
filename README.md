# Telegram API Proxy on Vercel

这是一个部署在 Vercel Edge Runtime 上的 Telegram Bot API 代理。它可以帮助你在无法直接访问 `api.telegram.org` 的环境下（如中国大陆）通过自己的 Vercel 域名访问 Telegram Bot API。

## 使用方法

将你的 Telegram Bot API 地址从 `https://api.telegram.org` 更改为你的 Vercel 部署域名即可。

例如：
`https://api.telegram.org/bot<TOKEN>/getMe`
变为：
`https://your-domain.vercel.app/bot<TOKEN>/getMe`

## 功能特点

- **Edge Runtime**: 极速响应，全球分发。
- **CORS 支持**: 支持跨域请求。
- **全方法转发**: 支持 GET, POST, OPTIONS 等。
- **无状态**: 不保存任何数据，仅做流量转发。

## 部署

1. Fork 本仓库。
2. 在 Vercel 中导入该项目。
3. 部署完成。

## 维护者

Antigravity
