# PocketCoder Bootstrap Constraints

## Fixed Workspace Set

Use exactly four workspaces:

- `apps/web`
- `apps/agentd`
- `apps/relay`
- `packages/protocol`

Do not add a fifth workspace during bootstrap. Do not create extra `packages/*` entries for convenience.

## Dependency Direction

Keep the dependency graph simple and one-way:

- `@pocketcoder/web` may depend on `@pocketcoder/protocol`
- `@pocketcoder/agentd` may depend on `@pocketcoder/protocol`
- `@pocketcoder/relay` may depend on `@pocketcoder/protocol`
- `@pocketcoder/protocol` must not depend on any app package
- `web`, `agentd`, and `relay` must not depend on each other

## High Cohesion / Low Coupling

Enforce these structural rules during bootstrap and repair:

- Keep UI code inside `apps/web`
- Keep desktop agent and PTY orchestration inside `apps/agentd`
- Keep network relay concerns inside `apps/relay`
- Keep only protocol contracts, schema helpers, and protocol-level constants inside `packages/protocol`
- Prefer adding internal folders inside a workspace before creating a new shared package
- Reject cross-app source imports or root-level business logic

## Root Requirements

The root scaffold must provide:

- `package.json` with `npm workspaces`
- `tsconfig.base.json` with strict TypeScript defaults
- `eslint.config.mjs` as the shared lint entry
- `.gitignore`
- `README.md`
- `.github/workflows/ci.yml`

The root scripts must include:

- `dev`
- `build`
- `lint`
- `typecheck`
- `test`

## Workspace Roles

### `apps/web`

Bootstrap a Next.js App Router shell for the mobile-first web client. Limit this workspace to app routing, UI composition, browser-side state, and browser integration placeholders.

### `apps/agentd`

Bootstrap a Node.js CLI daemon shell for the Windows-first desktop agent. Limit this workspace to CLI startup, local session management, provider integration points, and platform/service placeholders.

### `apps/relay`

Bootstrap a Fastify plus WebSocket service shell. Limit this workspace to server bootstrap, HTTP and WebSocket transport placeholders, storage boundaries, and relay-specific modules.

### `packages/protocol`

Bootstrap the only shared contract package. Keep it focused on protocol constants, schemas, typed envelopes, and protocol-compatible helpers.

## Structural Errors To Prevent

Treat these as bootstrap failures or repair warnings that require follow-up:

- adding a new shared package instead of using `packages/protocol`
- importing one app workspace directly from another app workspace
- storing business logic at the repository root
- omitting root lint, typecheck, test, or CI entry points
- copying protocol structures into app-local folders instead of sharing from `packages/protocol`

## Repair Policy

Use non-destructive repair by default:

- create missing files and directories
- leave identical files untouched
- report conflicting existing files instead of overwriting them
- overwrite only when the caller passed `--allow-overwrite`

## Validation Expectations

After bootstrap or repair:

1. run `scripts/verify_monorepo.py`
2. confirm the fixed workspace set still holds
3. confirm the root scripts exist
4. optionally run `npm install`, `npm run typecheck`, and `npm run test` when runnable output is expected