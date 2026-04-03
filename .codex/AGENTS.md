# Repository Guidelines

## Project Structure & Module Organization
- Core app workspaces are fixed: `apps/web`, `apps/agentd`, `apps/relay`, and `packages/protocol`.
- Deployment files belong in `infra/`. Planning and design materials belong in the repo docs and `skills-generate-plan/`.
- Repo-local Codex assets live under `.codex/`, especially `.codex/skills/`, `.codex/AGENTS.md`, and `.codex/PROJECT.md`.
- Keep high cohesion and low coupling: `web`, `agentd`, and `relay` must not import each other directly; shared contracts come only from `packages/protocol`.

## Build, Test, and Development Commands
- Run repo-wide checks from the root:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Start local development with `npm run dev`.
- Prefer `rg --files` and `rg "<pattern>"` for fast repo inspection.

## Coding Style & Naming Conventions
- Code, identifiers, package names, protocol fields, and directory names use English.
- Documentation, plans, issue discussion, and review notes default to Chinese.
- Package names follow `@pocketcoder/<name>`.
- Keep module boundaries explicit. Do not bury platform logic, protocol parsing, or storage policy inside UI or transport glue code.

## Testing Guidelines
- Tests stay inside the owning workspace.
- Naming rules:
  - `*.spec.ts` for unit and integration tests
  - `*.smoke.ts` for smoke flow tests
- Any high-risk change to protocol, relay routing, session state, pairing, or desktop control should add or update regression coverage.

## Commit & Push Guidelines
- After completing each meaningful, verifiable part of the project, commit and push the code proactively instead of waiting until the very end.
- Commit messages must be written in Chinese and must clearly describe the actual change. Do not use vague messages such as `update` or `fix`.
- Prefer Conventional Commit prefixes, but the subject text after the prefix must be Chinese, for example:
  - `feat(web): <Chinese summary for the completed web change>`
  - `fix(relay): <Chinese summary for the relay bug fix>`
  - `chore(repo): <Chinese summary for the repo maintenance change>`
- Before pushing, make sure the related validation has been run and the working tree does not include accidental generated artifacts.
- Before pushing, explicitly verify that edited files, docs, and commit text do not contain garbled Chinese or mojibake caused by encoding issues.

## Security & Configuration Tips
- Never commit real keys, pairing tokens, credentials, runtime caches, screenshots, or sensitive logs.
- Only commit example configuration such as `.env.example`.
- Generated local artifacts such as `.next*`, `.agentd/`, `.playwright-mcp/`, `.codex-cache/`, and temporary trace files must stay ignored.
