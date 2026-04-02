# Scenario Matrix

Use this file when deciding what the minimum regression shell must cover.

## Pairing

- valid token pairs successfully
- expired token is rejected
- already-used token is rejected
- unpaired device cannot subscribe later

## Realtime Session Flow

- session subscription succeeds
- prompt submission reaches the current session boundary
- approval request becomes visible and can be answered
- desktop-control release or local recovery invalidates remote control

## Reconnect and Replay

- reconnect resumes the current subscription
- a recent replay window is available after reconnect
- replay stays bounded to the recent encrypted-event window

## Idempotency and Dedupe

- duplicate `messageId` values do not apply twice
- repeated retries do not duplicate effectful commands