# PocketCoder

PocketCoder is a TypeScript monorepo for a mobile-first web client, a desktop agent daemon, a relay service, and a shared protocol package.

## Workspaces

- `apps/web`: Next.js App Router shell for the browser client
- `apps/agentd`: Node.js daemon shell for the desktop-side agent
- `apps/relay`: Fastify and WebSocket shell for the relay service
- `packages/protocol`: Shared protocol contracts and schema exports

## Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Documents

- `设计方案/`
- `项目开发规范.md`