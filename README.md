# one-page

单页 Markdown 编辑器，左侧输入、右侧实时预览。

## 功能

- 基于 [markstream-vue](https://github.com/Simon-He95/markstream-vue) 的流式 Markdown 渲染
- [Nuxt 4](https://nuxt.com/) — SSR、文件路由、组件自动导入
- [UnoCSS](https://github.com/unocss/unocss) 原子化 CSS
- 深色模式（[ColorMode](https://github.com/nuxt-modules/color-mode)）
- 分享链接：内容存服务端，生成短链接 `?s=xxx` 供他人打开

## 开发

```bash
pnpm install
pnpm dev
```

本地开发时分享数据默认写入 `.data/shares/`（无需 Redis）。

## 生产环境（Vercel）

分享功能需要 Redis 存储。在 Vercel 项目里安装 [Upstash Redis](https://vercel.com/marketplace/upstash) 集成后，会自动注入 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`（或 `UPSTASH_REDIS_REST_*`），重新部署即可。

## 构建

```bash
pnpm build
pnpm preview
```

## 技术栈

- Nuxt 4 + Vue 3 + TypeScript
- UnoCSS
- markstream-vue
- VueUse

## License

[MIT](./LICENSE)
