# Workspace Test Map

Use this file when deciding where a test belongs.

## `packages/protocol`

Own schema and compatibility coverage. Keep pure contract validation here instead of pushing it down into app workspaces.

## `apps/relay`

Own WebSocket, pairing-entry, replay-window, and dedupe-oriented integration coverage. Relay tests should focus on routing and metadata behavior, not browser or PTY details.

## `apps/agentd`

Own command, state, event-flow, and local-control invalidation coverage. Agent tests should stay close to agent boundaries instead of replaying the entire web flow.

## `apps/web`

Own browser-side helper unit coverage and PWA smoke coverage for key routes and visible states.