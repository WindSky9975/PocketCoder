# Test Constraints

## Baseline Gates

Keep the project aligned to these rules:

- failing `lint`, `typecheck`, or relevant tests blocks the change
- core protocol, relay, and agent logic must have automated coverage
- the first web shell must at least keep critical pages and the main route flow smoke-testable

## Fixture Safety

Never place these in test fixtures, snapshots, or sample logs:

- private keys or seed material
- real pairing tokens
- real credentials or API keys
- undeidentified user data

## Structural Errors To Reject

Treat these as QA-boundary failures:

- a detached test workspace that duplicates workspace ownership
- tests that only assert implementation trivia instead of boundary behavior
- missing regression placeholders after protocol, pairing, replay, reconnect, or permission changes
- fabricated verification claims without an actual automated or documented validation step