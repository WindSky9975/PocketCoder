# Platform Boundaries

Use this file when deciding what the Windows layer may know about other modules.

## Allowed Dependencies

The Windows layer may depend on stable interfaces or callbacks supplied by session or transport code, as long as it does not import or re-implement their internals.

## Disallowed Coupling

Do not let the Windows layer:

- import web or relay implementation code
- define shared protocol messages locally
- parse PTY output to infer local desktop recovery
- mutate unrelated session internals directly

## Practical Placement

Keep these responsibilities separate:

- `input-detector.ts` for platform event capture
- `control-state.ts` for recovered-control state and transitions
- `desktop-control.ts` for wiring platform events into stable outward notifications