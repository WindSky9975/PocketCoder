# Message Catalog

Use this file as the minimum V1 catalog and placement guide.

## Pairing Messages

| Type | Category | Direction | Minimal payload responsibility | Ack expectation | Dedup note |
| --- | --- | --- | --- | --- | --- |
| `PairingInit` | pairing command | web -> relay | pairing token, device identity bootstrap, public key handoff | optional | dedup by `messageId`; token validity is checked elsewhere |
| `PairingConfirm` | pairing command | agentd -> relay -> web | pairing confirmation and device-side confirmation data | optional | dedup by `messageId` |
| `DeviceRegistered` | pairing event | relay -> web / agentd | registered device identity and registration timestamp | no | latest event wins |

## Session and Realtime Messages

| Type | Category | Direction | Minimal payload responsibility | Ack expectation | Dedup note |
| --- | --- | --- | --- | --- | --- |
| `SessionSummary` | session event | agentd -> relay -> web | session identity, provider, status, and last activity snapshot | no | treat as replaceable snapshot |
| `SessionSubscribe` | session command | web -> relay | session id to follow | yes | must dedup by `messageId` |
| `SessionOutputDelta` | realtime event | agentd -> relay -> web | session id, output delta, stream metadata | no | dedup by `messageId`; ordering is handled elsewhere |
| `SessionStateChanged` | session event | agentd -> relay -> web | session id, new status, optional reason | no | latest event wins |
| `ApprovalRequested` | approval event | agentd -> relay -> web | session id, approval id, human-readable prompt | yes when delivery guarantees matter | dedup by `messageId` |
| `ApprovalResponse` | approval command | web -> relay -> agentd | approval id, decision, session id | yes | must dedup by `messageId` |

## Control Messages

| Type | Category | Direction | Minimal payload responsibility | Ack expectation | Dedup note |
| --- | --- | --- | --- | --- | --- |
| `SendPrompt` | control command | web -> relay -> agentd | session id and prompt text | yes | must dedup by `messageId` |
| `InterruptSession` | control command | web -> relay -> agentd | session id and optional reason | yes | must dedup by `messageId` |
| `ResumeDesktopControl` | control command | web -> relay -> agentd | session id and caller intent to release remote control | yes | must dedup by `messageId` |
| `Ack` | generic response | any responder -> original caller | acknowledged message id and acceptance result | no | one ack per handled command |
| `ErrorEnvelope` | generic error | any responder -> caller | protocol-visible error code, message, optional details | no | tied to the failed command or event |

## Placement Guidance

- Pairing-related payloads belong in `schemas/pairing.ts`.
- Session summaries, subscriptions, output deltas, state changes, and approval requests belong in `schemas/session.ts`.
- Approval responses and remote-control commands belong in `schemas/command.ts`.
- Shared error payloads belong in `schemas/error.ts` and `errors/codes.ts`.
- Type names and payload field names stay in English.