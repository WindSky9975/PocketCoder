---
name: typescript-monorepo-bootstrap
description: Bootstrap or repair the PocketCoder TypeScript monorepo skeleton with npm workspaces. Use when Codex needs to initialize the repo, restore missing root configuration, recreate the fixed workspaces (`apps/web`, `apps/agentd`, `apps/relay`, `packages/protocol`), or correct structure drift while preserving the project's high-cohesion and low-coupling boundaries.
---

# TypeScript Monorepo Bootstrap

## Overview

Create or repair only the PocketCoder V1 monorepo scaffold. Keep the result minimal, structurally correct, and ready for follow-up implementation. Do not add business logic, protocol details, runtime features, or extra shared packages.

## Workflow

1. Inspect the current repository shape and determine whether the task is `init` or `repair`.
2. Read [`references/pocketcoder-bootstrap-constraints.md`](references/pocketcoder-bootstrap-constraints.md) before changing files.
3. Read [`references/file-contracts.md`](references/file-contracts.md) when deciding which files or directories must exist.
4. Use `scripts/init_monorepo.py` to create or repair the scaffold from `assets/templates/`.
5. Use `scripts/verify_monorepo.py` after generation to detect missing files, script drift, or unexpected workspace structure.
6. If the environment allows it and the user expects runnable output, run the minimal repo checks: `npm install`, `npm run typecheck`, and `npm run test`.

## Rules

- Keep the workspace set fixed to `apps/web`, `apps/agentd`, `apps/relay`, and `packages/protocol`.
- Treat `packages/protocol` as the only cross-runtime shared contract package.
- Keep each workspace cohesive around one responsibility. Do not create new shared layers for speculative reuse.
- Preserve low coupling: `web`, `agentd`, and `relay` must not import each other directly.
- Use the templates as minimal skeletons. Do not inject product logic, transport logic, encryption logic, or UI flows.
- Prefer non-destructive repair. If a target file already exists and the change is not obviously safe, surface the conflict instead of overwriting silently.
- Keep root scripts consistent across the repo: `dev`, `build`, `lint`, `typecheck`, and `test`.
- Keep TypeScript strict mode enabled through the shared base config.

## Init vs Repair

### Initialize

Use `scripts/init_monorepo.py <repo> --mode init` when the repository is empty or missing most of the required scaffold. Generate the full root structure, all four workspaces, placeholder directories, and the CI/lint/typecheck entry points.

### Repair

Use `scripts/init_monorepo.py <repo> --mode repair` when the repository already exists but is missing required files or has partial structure drift. Repair only the missing or explicitly allowed files. Do not replace existing implementation files unless overwrite was requested.

## File Contracts

Follow [`references/file-contracts.md`](references/file-contracts.md) as the source of truth for:

- required root files
- required workspace files
- placeholder directories that must exist for later feature work
- boundary expectations for each workspace

## Resources

### `scripts/init_monorepo.py`

Run this script to copy the skill templates into a target repository. Use `--dry-run` before write operations when you need a change preview. Use `--allow-overwrite` only when replacing existing files is intentional.

### `scripts/verify_monorepo.py`

Run this script after generation or repair. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented project constraint.

### `assets/templates/`

Use these files as the canonical minimal PocketCoder scaffold. Copy them into the target repository; do not re-invent the skeleton unless the project documents changed.

## Output Expectations

After using this skill, report:

- whether the operation was `init` or `repair`
- which files were created, updated, skipped, or left in conflict
- whether the repository now matches the fixed workspace contract
- which areas remain intentionally unimplemented because they belong to later skills