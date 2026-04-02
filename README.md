# PocketCoder

PocketCoder 是一个 TypeScript Monorepo，包含手机优先的 Web 客户端、桌面端 Agent 守护进程、Relay 服务，以及共享协议包。

## 工作区

- `apps/web`：基于 Next.js App Router 的浏览器端外壳
- `apps/agentd`：桌面端 Agent 的 Node.js 守护进程外壳
- `apps/relay`：基于 Fastify 和 WebSocket 的 Relay 服务外壳
- `packages/protocol`：共享协议契约与 Schema 导出

## 常用命令

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## 设计与计划文档

- `设计方案/`
- `项目开发规范.md`
- `项目完成计划.md`
- `项目里程碑计划.md`
