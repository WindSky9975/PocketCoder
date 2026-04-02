# PWA Contracts

Use this file when shaping the mobile-web install boundary.

## Required Artifacts

Keep these entry points present in the shell:

- `public/manifest.webmanifest`
- `public/icons/`
- a browser-side install boundary under `lib/pwa/`
- a reserved service-worker boundary such as `service-worker/`

## Install Contract

The app should be install-ready, but V1 must not depend on install-only behavior to complete core flows.

## Service Worker Contract

Reserve a clear service-worker boundary, but do not bury application logic inside it. The service worker remains an integration surface, not the home of session UX or protocol parsing.

## Push-Notification Constraint

Do not make push notifications a prerequisite for pairing, session viewing, prompt sending, or approval handling in V1.

## Anti-Patterns

Treat these as PWA-boundary problems:

- manifest missing or not linked from the layout
- no reserved icons directory
- no stable install boundary
- service-worker code mixed directly into route files