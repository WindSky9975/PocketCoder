---
name: docker-compose-selfhost
description: Design, create, or repair the PocketCoder single-host Docker Compose deployment layer for `relay + SQLite`. Use when Codex needs to bootstrap or fix `compose.yaml`, `infra/docker/relay.Dockerfile`, `.env.example`, volume mounts, health checks, or the selfhost skeleton that keeps deployment concerns separate from business code and stays scoped to local or single-machine operation.
---

# Docker Compose Selfhost

## Overview

Create or repair only the PocketCoder selfhost deployment shell. Keep Compose, Dockerfile, environment templates, health checks, and volume boundaries inside the deployment layer. Do not move relay business logic, protocol design, browser logic, or desktop logic into deployment files.

## Workflow

1. Inspect the current deployment structure and decide whether the task is `init`, `repair`, or selfhost evolution.
2. Read [`references/selfhost-constraints.md`](references/selfhost-constraints.md) before editing files.
3. Read [`references/compose-map.md`](references/compose-map.md) when shaping `compose.yaml` services, ports, restart policy, and health checks.
4. Read [`references/env-contracts.md`](references/env-contracts.md) when editing `.env.example` or deployment-facing configuration names.
5. Read [`references/volume-boundaries.md`](references/volume-boundaries.md) when placing SQLite data paths, writable directories, or persistence rules.
6. Use `scripts/init_selfhost_stack.py` to create or repair the selfhost skeleton from the bundled templates.
7. Use `scripts/verify_selfhost_stack.py` after changes to confirm the required files, directories, and deployment boundaries still hold.
8. If the environment is available and the user expects executable output, run the minimal deployment checks such as `docker compose config` and `docker compose up -d`.

## Rules

- Keep deployment scope limited to single-host Docker Compose for `relay + SQLite`.
- Keep `infra/` deployment-only. Do not place business logic there.
- Keep SQLite embedded in the relay runtime. Do not add extra Postgres or Redis services for the V1 skeleton.
- Keep environment configuration explicit, documented, and safe to commit as placeholders only.
- Keep high cohesion by grouping Compose, Dockerfile, and environment templates together under deployment boundaries.
- Keep low coupling by preventing deployment concerns from leaking into app source files.
- Do not treat this skill as a production hardening, TLS, reverse-proxy, or cloud-template skill.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.

## Design Boundary

### Allowed Work

- create or repair `compose.yaml`, `.env.example`, and `infra/docker/relay.Dockerfile`
- define relay-only service, health check, port mapping, and volume placeholders
- define deployment-facing environment variables for host, port, data path, and TTL-like settings
- define the minimal single-host persistence boundary for SQLite data

### Forbidden Work

- implement relay business endpoints or application routing logic
- add unsupported supporting services such as Redis or Postgres to the baseline stack
- build a production reverse-proxy, TLS, or public internet exposure setup
- create Kubernetes, cloud, or multi-node orchestration artifacts
- hide secrets in tracked files or hardcode production credentials

## Resource Use

### `references/selfhost-constraints.md`

Read this first whenever a change affects deployment scope, SQLite assumptions, or sensitive configuration rules.

### `references/compose-map.md`

Read this when shaping Compose service layout, restart policy, or health checks.

### `references/env-contracts.md`

Read this when defining environment variable names, defaults, or sensitivity expectations.

### `references/volume-boundaries.md`

Read this when placing persistent data paths, writable directories, or upgrade-safe storage.

### `scripts/init_selfhost_stack.py`

Run this for empty-stack initialization or structural repair of the selfhost deployment shell.

### `scripts/verify_selfhost_stack.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented deployment constraint.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or selfhost evolution
- which deployment files were created, updated, skipped, or left in conflict
- whether the stack still stays scoped to relay, SQLite persistence, and local single-host operation
- which later-stage deployment concerns remain intentionally unimplemented