export const MESSAGE_TYPE_VALUES = [
  "PairingInit",
  "PairingConfirm",
  "DeviceRegistered",
  "SessionSummary",
  "SessionSubscribe",
  "SessionOutputDelta",
  "SessionStateChanged",
  "ApprovalRequested",
  "ApprovalResponse",
  "SendPrompt",
  "InterruptSession",
  "ResumeDesktopControl",
  "Ack",
  "ErrorEnvelope"
] as const;

export type MessageType = (typeof MESSAGE_TYPE_VALUES)[number];