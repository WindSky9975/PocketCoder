# Transport Contracts

Use this file when shaping `apps/agentd/src/transport`.

## Relay Client

`relay-client.ts` owns outbound and inbound communication setup with the relay boundary. It may manage connection lifecycle, auth headers, reconnect hooks, and send/receive adapters, but it must not absorb session-state rules or provider parsing.

## Command Handler

`command-handler.ts` owns translation from inbound protocol-framed commands into runtime actions. It should validate or adapt messages and hand work to session-management or provider boundaries.

## Event Publisher

`event-publisher.ts` owns outbound publishing of normalized runtime events. It should not decide PTY parsing details or session-state transitions on its own.

## Dependency Rules

- transport depends on `@pocketcoder/protocol`
- transport may collaborate with session-management boundaries through stable interfaces
- transport must not import relay internals or deep sibling-app implementation paths
- transport must not become the persistence layer for session records

## Anti-Patterns

Treat these as transport-boundary problems:

- direct imports from `apps/relay` implementation files
- command handlers that mutate provider internals without a stable runtime boundary
- event publishers that parse raw PTY output instead of receiving normalized events