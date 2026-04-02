# File Contracts

Use this file as the minimal required output contract for the PocketCoder monorepo bootstrap.

## Root Files

| Path | Required | Placeholder Allowed | Purpose |
| --- | --- | --- | --- |
| `package.json` | yes | no | Define `npm workspaces`, root scripts, and shared dev tooling. |
| `tsconfig.base.json` | yes | no | Define strict TypeScript defaults reused by all workspaces. |
| `eslint.config.mjs` | yes | no | Provide a single lint entry for the whole repo. |
| `.gitignore` | yes | no | Ignore dependencies, builds, logs, and local-only files. |
| `README.md` | yes | yes | Explain the repo intent, workspace layout, and main commands. |
| `.github/workflows/ci.yml` | yes | yes | Reserve CI checks for lint, typecheck, and test. |

## `apps/web`

### Files

| Path | Required | Placeholder Allowed | Purpose |
| --- | --- | --- | --- |
| `apps/web/package.json` | yes | no | Define the Next.js workspace and scripts. |
| `apps/web/tsconfig.json` | yes | no | Bind the web workspace to the shared TS config. |
| `apps/web/next.config.ts` | yes | yes | Provide the minimal Next.js config entry. |
| `apps/web/next-env.d.ts` | yes | no | Support Next.js type generation. |
| `apps/web/public/manifest.webmanifest` | yes | yes | Reserve the PWA manifest entry point. |
| `apps/web/src/app/layout.tsx` | yes | no | Provide the root app layout. |
| `apps/web/src/app/page.tsx` | yes | no | Provide the bootstrap landing page. |
| `apps/web/src/app/globals.css` | yes | no | Provide global web styles. |

### Directories

Create these directories if absent. Use `.gitkeep` when they would otherwise be empty:

- `apps/web/src/features`
- `apps/web/src/components/ui`
- `apps/web/src/lib`
- `apps/web/src/tests`
- `apps/web/public/icons`

## `apps/agentd`

### Files

| Path | Required | Placeholder Allowed | Purpose |
| --- | --- | --- | --- |
| `apps/agentd/package.json` | yes | no | Define the Node daemon workspace and scripts. |
| `apps/agentd/tsconfig.json` | yes | no | Bind the daemon workspace to the shared TS config. |
| `apps/agentd/src/bootstrap.ts` | yes | no | Provide the process bootstrap entry point. |
| `apps/agentd/src/cli/index.ts` | yes | no | Provide the CLI startup boundary. |

### Directories

Create these directories if absent. Use `.gitkeep` when they would otherwise be empty:

- `apps/agentd/src/providers/codex`
- `apps/agentd/src/sessions`
- `apps/agentd/src/transport`
- `apps/agentd/src/security`
- `apps/agentd/src/platform/windows`
- `apps/agentd/tests`

## `apps/relay`

### Files

| Path | Required | Placeholder Allowed | Purpose |
| --- | --- | --- | --- |
| `apps/relay/package.json` | yes | no | Define the relay workspace and scripts. |
| `apps/relay/tsconfig.json` | yes | no | Bind the relay workspace to the shared TS config. |
| `apps/relay/src/app.ts` | yes | no | Provide the Fastify app builder. |
| `apps/relay/src/server.ts` | yes | no | Provide the server startup entry point. |

### Directories

Create these directories if absent. Use `.gitkeep` when they would otherwise be empty:

- `apps/relay/src/modules`
- `apps/relay/src/transport/http`
- `apps/relay/src/transport/ws`
- `apps/relay/src/security`
- `apps/relay/src/storage`
- `apps/relay/tests`

## `packages/protocol`

### Files

| Path | Required | Placeholder Allowed | Purpose |
| --- | --- | --- | --- |
| `packages/protocol/package.json` | yes | no | Define the shared protocol package and build output. |
| `packages/protocol/tsconfig.json` | yes | no | Bind the protocol package to the shared TS config. |
| `packages/protocol/src/index.ts` | yes | no | Provide the protocol package export surface. |

### Directories

Create these directories if absent. Use `.gitkeep` when they would otherwise be empty:

- `packages/protocol/src/constants`
- `packages/protocol/src/schemas`
- `packages/protocol/src/errors`
- `packages/protocol/src/utils`
- `packages/protocol/tests`

## Boundary Rules

Preserve these boundaries while generating the files above:

- `web`, `agentd`, and `relay` may reference `@pocketcoder/protocol`, but not each other
- no root-level business source tree should be created by this bootstrap
- do not create additional shared packages
- keep placeholder files minimal and focused on compileable entry points