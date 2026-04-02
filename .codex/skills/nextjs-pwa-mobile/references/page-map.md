# Page Map

Use this file when deciding what belongs in `src/app/`.

## `/`

Use the root page as a lightweight mobile-first entry surface. It may summarize the product shell and link to the fixed routes, but it should not become a replacement for all app flows.

## `/pair`

Use this page for pairing or login bootstrap:

- explain device-pairing readiness
- host the pairing entry surface
- keep deep key-exchange logic outside the page shell

## `/sessions`

Use this page for the session list:

- show session cards or summaries
- expose status and activity snapshots
- defer realtime transport internals to `lib/realtime/` or feature boundaries

## `/sessions/[sessionId]`

Use this page for the session detail shell:

- show realtime output area
- show prompt input at the bottom
- show approval-request surface
- show explicit release-control action
- avoid embedding transport or protocol parsing details directly in the route file

## `/connection-error`

Use this page for failed connection or degraded-session states:

- explain the problem in a mobile-readable way
- show retry or recovery affordances
- keep transport reconnection logic outside the page component