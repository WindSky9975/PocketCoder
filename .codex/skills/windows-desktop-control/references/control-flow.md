# Control Flow

Use this file when shaping how remote control ends and how the rest of agentd learns about it.

## Explicit Release Command

When the mobile side chooses "return control to desktop," the platform layer should translate that command into the same local-control-recovered state used by detected desktop input.

## Detected Desktop Input

When Windows reports a confirmed local keyboard recovery event for the current session, the platform layer should mark remote control as invalid immediately.

## Downstream Consequences

After recovery is marked:

- the current session state must update
- outbound event publication may notify relay and connected clients
- later remote-control commands for that session must be blocked or ignored

## Session Scope

This behavior must be scoped to the current session. Avoid vague process-wide booleans that make it unclear which session lost remote control.