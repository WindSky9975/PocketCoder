# Pairing Flow

Use this file when shaping the desktop-to-browser trust bootstrap.

## Step 1: Desktop Issues a Token

`agentd` creates a short-lived pairing token and exposes a URL or QR payload for the browser side. The token should be single-use and should not become the long-term trust anchor.

## Step 2: Browser Starts Pairing

The browser device creates or loads its own device-key reference, then sends the one-time token plus its public key candidate through the pairing entry surface.

## Step 3: Relay Validates and Registers

Relay validates the token, binds the desktop device and browser device, stores only the minimum registration metadata, and returns the smallest access capability needed for later session subscription.

## Step 4: Pairing Finalizes

Desktop and browser record the paired-device relationship through their own secure or local storage boundaries. Relay should keep only the registration and ciphertext-routing metadata needed for later use.

## Actor Boundaries

### `agentd`

- issue the one-time token
- expose the desktop public key reference
- hand outbound payloads to the encryption entry point

### `relay`

- validate the token and expiration
- register the device pair
- enforce revoked-device restrictions
- route ciphertext after pairing succeeds

### `web`

- start the pairing request
- hold browser-device key references
- persist paired-device metadata through the storage boundary
- keep page-level composition separate from the crypto entry points