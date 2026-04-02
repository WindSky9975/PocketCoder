# Transport Flow

Use this file to keep HTTP and WebSocket flows consistent with PocketCoder V1.

## HTTP Flow

### Health Check

1. request enters Fastify HTTP route
2. route returns a lightweight health payload
3. no session logic or plaintext event inspection occurs here

### Pairing Bootstrap

1. request enters an HTTP pairing route
2. route validates request shape against `@pocketcoder/protocol` contracts or route-local request constraints
3. route hands off token/device decisions to service or security boundaries
4. route persists only minimal metadata through repositories
5. route returns registration or rejection metadata without leaking private session content

## WebSocket Connection Flow

1. client opens the WebSocket connection
2. relay performs connection bootstrap and access control
3. relay attaches connection context and heartbeat hooks
4. client sends protocol-framed messages
5. relay validates inbound messages at the boundary using shared protocol schemas
6. relay routes encrypted payloads or metadata to modules/repositories as needed

## Session Subscription Flow

1. client sends `SessionSubscribe`
2. relay validates the message
3. relay records or refreshes subscription/session-route metadata
4. relay may replay recent encrypted events for that session
5. relay keeps WebSocket delivery separate from replay-policy decisions

## Event Forwarding Flow

1. upstream encrypted event arrives from `agentd`
2. relay validates the envelope shape
3. relay stores only the encrypted replay blob and minimal route metadata when required
4. relay forwards the encrypted event to subscribed clients
5. relay does not parse plaintext business content

## Heartbeat and Presence Flow

1. connection heartbeat arrives or timer fires
2. relay updates presence metadata through a repository or module
3. relay marks stale connections offline when the presence policy says so

## Deduplication Flow

1. inbound command arrives with `messageId`
2. relay validates the protocol envelope
3. relay checks processed-command storage before forwarding
4. relay records the command handling marker at the storage boundary
5. relay forwards or rejects the command accordingly