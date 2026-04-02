# Web Constraints

## Scope

`apps/web` is the mobile-first browser shell for PocketCoder V1. It owns page composition, browser-side interaction flows, device-local state entry points, realtime connection entry points, and PWA install readiness. It must not become the home of relay-service logic, desktop-agent logic, or shared protocol definitions.

## Fixed Technical Direction

Keep the web app aligned to these choices:

- Next.js App Router
- mobile-first layout and interaction assumptions
- PWA install readiness in V1
- WebSocket as the primary realtime channel
- `@pocketcoder/protocol` as the only shared contract source

## Fixed Page Set

Preserve this baseline route set:

- pair/login page
- session list page
- session detail page
- connection-error page

The root page may act as a gateway or overview, but these routes remain the core flow.

## Session Detail Expectations

The session detail shell must leave room for:

- realtime output stream
- bottom-fixed prompt input
- approval card with allow and deny actions
- explicit action to return control to the desktop side

## High Cohesion / Low Coupling

Preserve these boundaries:

- `app/` for routing, layout, and page assembly
- `features/` for domain-facing page logic by scenario
- `components/ui/` for reusable UI building blocks
- `lib/crypto/` for browser-side crypto hooks only
- `lib/protocol/` for protocol adaptation boundaries only
- `lib/realtime/` for realtime connection hooks only
- `lib/storage/` for device-local storage boundaries only
- `lib/pwa/` for install and service-worker entry points only
- `src/tests/` for smoke and unit test structure only

## Structural Errors To Reject

Treat these as design failures:

- importing `apps/relay` or `apps/agentd` implementation code into the web app
- embedding protocol schema definitions locally instead of using `@pocketcoder/protocol`
- piling realtime, storage, or crypto implementation into route files
- treating push notifications as a required part of the core V1 flow
- abandoning mobile-first layout assumptions in the base shell