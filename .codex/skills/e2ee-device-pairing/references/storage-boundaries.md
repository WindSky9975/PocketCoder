# Storage Boundaries

Use this file when deciding what relay or browser-local storage may hold.

## Relay May Store

- device identifiers and public keys
- token hashes, expiration timestamps, and usage markers
- session routing identifiers
- heartbeat timestamps and presence hints
- ciphertext event blobs with TTL or replay-window metadata
- revoked-device markers and deduplication records

## Relay Must Not Store

- plaintext session payloads
- desktop private keys
- browser private keys
- durable browser secrets beyond public registration metadata
- UI-only state that belongs in browser-local storage

## Browser-Local Storage May Store

- paired-device identity
- relay origin or environment reference
- paired-at timestamps and minimal capability hints
- secure-store references for browser private-key material

## Replay Boundary

Replay is limited to a short rolling window of ciphertext events. Long-term plaintext history is outside V1 scope.

## Practical Rule

If a value would let relay read or reconstruct session plaintext, it does not belong in relay storage.