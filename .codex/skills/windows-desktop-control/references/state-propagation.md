# State Propagation

Use this file when defining the event path from local input recovery to remote-control invalidation.

## Recommended Order

1. Detect a release-control command or local input recovery for a specific session.
2. Mark the Windows control state as recovered for that session.
3. Notify the session-facing callback or boundary.
4. Publish or queue any transport-facing invalidation event.
5. Reject later remote-control commands until the session re-establishes control explicitly.

## Event Shape Guidance

Keep platform events narrow. A stable event typically needs:

- `sessionId`
- a `source` such as `command` or `local-input`
- a timestamp
- a reason suitable for logs and state transitions

## Anti-Patterns

Treat these as propagation mistakes:

- letting transport publish invalidation before the local state changes
- mutating session state directly from a raw Windows callback
- failing to distinguish explicit release from detected local recovery