# Crypto Constraints

## Scope

This skill owns the pairing and E2EE shell for PocketCoder V1. It must preserve a complete end-to-end encryption model across desktop, relay, and browser layers from the first usable version.

## Fixed Security Direction

Keep the security layer aligned to these choices:

- desktop and browser devices each create their own long-lived keypair
- pairing starts from a one-time token issued by `agentd`
- pairing exchanges public keys and returns a minimal access capability
- relay stores routing metadata and ciphertext only
- unpaired or revoked devices must not subscribe to future sessions

## Secret-Handling Rules

Never place these values in tracked files, logs, snapshots, or screenshots:

- private keys or seed material
- raw pairing tokens
- plaintext session payloads
- production credentials or real-user secrets

Use references or secure-store handles in code scaffolding instead of fake plaintext secrets that look real.

## High Cohesion / Low Coupling

Preserve these boundaries:

- `apps/agentd/src/security/` for desktop key lifecycle and outbound encryption entry points
- `apps/relay/src/security/` for token validation, device registration, and capability checks
- `apps/relay/src/storage/repositories/` for metadata and ciphertext persistence boundaries
- `apps/web/src/lib/crypto/` for browser key lifecycle and decrypt-entry boundaries
- `apps/web/src/lib/storage/` for paired-device persistence boundaries
- `apps/web/src/features/pairing/` for pairing-flow composition only

## Structural Errors To Reject

Treat these as security-boundary failures:

- relay files that persist or inspect plaintext session content
- page components or PTY runtime files that own pairing-token validation
- browser pages that implement key-exchange mechanics directly
- local app files that redefine shared protocol schemas
- repository files that embed example private keys, durable tokens, or real secrets