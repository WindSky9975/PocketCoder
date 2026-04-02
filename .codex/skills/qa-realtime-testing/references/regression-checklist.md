# Regression Checklist

Use this file after high-risk changes.

## Trigger Conditions

Run the relevant regression shell when a change touches:

- protocol schemas or compatibility assumptions
- pairing or E2EE boundaries
- relay subscription, replay, or dedupe flow
- agent session state, command flow, or desktop-control recovery
- web realtime interaction, approval UX, or smoke routes

## Minimum Review Order

1. Confirm the owning workspace tests still exist.
2. Confirm the affected high-risk scenario placeholder is still covered.
3. Run the narrowest relevant tests first.
4. Run wider workspace tests or the full suite when the change crosses multiple boundaries.
5. Record any intentionally deferred executable coverage instead of pretending it passed.