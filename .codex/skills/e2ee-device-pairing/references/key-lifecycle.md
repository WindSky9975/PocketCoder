# Key Lifecycle

Use this file when designing key creation, references, rotation, or revocation.

## Desktop Device Keys

The desktop device creates its long-lived keypair on first run and keeps the private key in a secure local store or ignored local file. Repo-tracked files should only reference where the private key lives.

## Browser Device Keys

The browser device creates its own long-lived keypair the first time pairing is attempted or completed. Browser code should persist only the minimum stable identifiers and secure-store references required to reconnect.

## Pairing Tokens

Pairing tokens are short-lived and single-use. They exist only to bootstrap trust and must not become a substitute for long-lived device identity.

## Revocation and Rotation

Device revocation must block future session access. Rotation may happen later, but the initial structure must leave a stable place for revocation state and new-key rollout without rewriting unrelated transport or UI files.

## Implementation Guidance

- keep private-key references separate from public-key records
- keep browser and desktop key lifecycle code independent
- keep relay aware of public keys and revocation metadata only
- keep real key generation out of generic helpers that are also used for non-security work