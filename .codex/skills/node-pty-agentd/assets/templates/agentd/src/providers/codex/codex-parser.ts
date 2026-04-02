export type CodexProviderEventType =
  | "session.started"
  | "session.output.delta"
  | "session.state.changed"
  | "session.approval.requested"
  | "session.error"
  | "session.ended";

export interface CodexProviderEvent {
  type: CodexProviderEventType;
  payload: Record<string, unknown>;
}

export function parseCodexOutput(chunk: string): CodexProviderEvent[] {
  if (!chunk.trim()) {
    return [];
  }

  return [
    {
      type: "session.output.delta",
      payload: { chunk }
    }
  ];
}