import type { SessionStatus } from "@pocketcoder/protocol";

const anyStatus = new Set<SessionStatus>([
  "idle",
  "running",
  "waiting_input",
  "waiting_approval",
  "error",
  "disconnected"
]);

export const ALLOWED_TRANSITIONS: Record<SessionStatus, Set<SessionStatus>> = {
  idle: new Set(["running", "error", "disconnected"]),
  running: new Set(["waiting_input", "waiting_approval", "error", "disconnected"]),
  waiting_input: new Set(["running", "error", "disconnected"]),
  waiting_approval: new Set(["running", "error", "disconnected"]),
  error: new Set(["idle", "disconnected"]),
  disconnected: anyStatus
};

export function canTransitionSession(from: SessionStatus, to: SessionStatus): boolean {
  return ALLOWED_TRANSITIONS[from].has(to);
}