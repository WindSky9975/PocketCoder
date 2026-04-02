# Repository Guidelines

## Project Structure & Module Organization
- Current repo state is docs-first. Core design docs live in [`设计方案/`](D:/develop/study/AI/PocketCoder/设计方案), repo policies in [`项目开发规范.md`](D:/develop/study/AI/PocketCoder/项目开发规范.md), and execution plans in [`skills-generate-plan/`](D:/develop/study/AI/PocketCoder/skills-generate-plan).
- Repo-local Codex skills live under [`.codex/skills/`](D:/develop/study/AI/PocketCoder/.codex/skills). Each skill should contain `SKILL.md`, `agents/openai.yaml`, optional `references/`, `assets/`, and `scripts/`.
- Target app layout is fixed by design: `apps/web`, `apps/agentd`, `apps/relay`, and `packages/protocol`. Deployment files belong in [`infra/`](D:/develop/study/AI/PocketCoder/infra), not inside app source trees.

## Build, Test, and Development Commands
- Current repo maintenance:
  - `python D:\WindSky\.codex\skills\.system\skill-creator\scripts\quick_validate.py .codex\skills\<skill-name>` validates a skill folder.
  - `python -m py_compile .codex\skills\<skill-name>\scripts\*.py` checks skill helper scripts.
  - `rg --files` or `rg "<pattern>"` is the preferred way to inspect the repo.
- Once the monorepo is bootstrapped, run all workspace tasks from the repo root:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`

## Coding Style & Naming Conventions
- Code, identifiers, protocol fields, and commit types use English. Docs, plans, and PR descriptions default to Chinese.
- Package names follow `@pocketcoder/<name>`. Directories use lowercase names and stable boundaries.
- Do not let `web`, `agentd`, and `relay` import each other’s source; shared contracts must come only from `packages/protocol`.
- Keep modules high-cohesion and low-coupling. Avoid cross-layer shortcuts and implicit state.

## Testing Guidelines
- Tests stay near the owning workspace; do not create a separate test workspace.
- Naming:
  - unit/integration tests: `*.spec.ts`
  - smoke tests: `*.smoke.ts`
- Minimum coverage follows the repo policy: protocol schemas, relay/agentd core logic, and web smoke flows must be testable.

## Commit & Pull Request Guidelines
- Recent history uses short summary commits, but the repository standard is Conventional Commits: `type(scope): subject`.
- Use examples like `feat(protocol): add session subscribe schema` or `docs(repo): add milestone plan`.
- PRs should state scope, affected modules, validation performed, and any protocol/config/security impact. Include screenshots only for web UI changes.

## Security & Configuration Tips
- Never commit real keys, pairing tokens, credentials, or sensitive logs.
- Only commit example config such as `.env.example`; document every new environment variable.
- AI-generated code, protocol changes, security logic, and concurrency-sensitive code require human review before merge.
