# Feature Boundaries

Use this file when deciding where browser-side responsibilities belong.

## `features/pairing`

Own pairing-page feature composition and pairing-facing interaction logic. Do not place browser-crypto implementation details directly in the route file.

## `features/sessions`

Own session-list and session-detail feature composition. This is where session-facing display helpers and composition hooks may live.

## `features/approvals`

Own approval card shells and approval-facing interaction composition. Do not embed protocol transport logic in UI primitives.

## `features/connection`

Own connection-state display and recovery-oriented presentation logic.

## `components/ui`

Keep this directory reusable and presentation-focused. Do not place session-specific business rules or protocol state here.

## `lib/crypto`

Reserve this for browser-side crypto boundaries and local key hooks only. Deep E2EE work belongs to a later security-focused skill.

## `lib/protocol`

Reserve this for browser-side protocol adaptation boundaries and typed message helpers. Do not define shared schemas here.

## `lib/realtime`

Reserve this for WebSocket connection, reconnect, and subscription boundaries.

## `lib/storage`

Reserve this for browser-local persistence boundaries such as paired-device identity or session cache hints.

## `lib/pwa`

Reserve this for manifest/install/service-worker boundaries.