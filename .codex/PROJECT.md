# PocketCoder Project Context

## What This Project Is
PocketCoder is a self-hosted, mobile-first remote control system for real `codex` sessions. The target V1 shape is:

- `apps/web`: Next.js PWA for phone access
- `apps/agentd`: Windows-first Node.js CLI daemon running on the desktop
- `apps/relay`: Fastify + WebSocket + SQLite relay
- `packages/protocol`: the only shared contract package

The core user flow is fixed: start a desktop `codex` session, pair a phone, view realtime output, send prompts, approve actions, then revoke remote control when local desktop input resumes.

## Current Repository State
This repository is still in a docs-and-scaffolding phase. It already contains:

- design docs in `设计方案/`
- engineering rules in `项目开发规范.md`
- milestone and completion plans at the repo root
- repo-local Codex skills in `.codex/skills/`

The main app workspaces may not be fully generated or implemented yet. Do not assume runnable production code already exists.

## Non-Negotiable Architecture Rules
- `packages/protocol` is the only cross-app shared contract source.
- `web`, `agentd`, and `relay` must not import each other’s implementation code.
- Relay routes metadata and ciphertext only; it must not own AI session logic or plaintext session content.
- `agentd` is the local source of truth for active sessions and Windows desktop control state.
- `web` owns mobile UX, browser storage, browser crypto entry points, and realtime UI only.
- Keep high cohesion and low coupling. Add new modules only when existing ones cannot safely own the responsibility.

## V1 Scope
In scope:

- Windows-first desktop support
- single-user, single-host deployment
- Docker Compose self-hosting for `relay + SQLite`
- device pairing and message-level E2EE
- realtime output, prompt sending, approval handling, reconnect, and recent replay

Out of scope:

- multi-user or multi-tenant features
- macOS/Linux desktop support
- SaaS/cloud deployment templates
- reverse proxy, TLS, HA, Kubernetes, or production ops hardening
- native mobile apps

## How To Work In This Repo
- Read `设计方案/V1-实施规划.md` and `项目开发规范.md` before major changes.
- Use `.codex/skills/` when implementing project subsystems; they encode the intended structure and validation flow.
- Prefer root-level plans and design docs over ad hoc decisions in chat.
- When changing protocol, security, directory structure, env vars, or deployment entry points, update the matching docs in the same change.

## Delivery Priority
Implement in this order:

1. monorepo bootstrap
2. protocol
3. relay
4. agentd
5. web
6. pairing and E2EE
7. Windows desktop control recovery
8. self-host deployment
9. tests and end-to-end validation