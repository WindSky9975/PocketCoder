export const SESSION_STATUS_VALUES = [
  "idle",
  "running",
  "waiting_input",
  "waiting_approval",
  "error",
  "disconnected"
] as const;

export type SessionStatus = (typeof SESSION_STATUS_VALUES)[number];