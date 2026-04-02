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

export const COMMAND_MESSAGE_TYPE_VALUES = [
  "PairingInit",
  "PairingConfirm",
  "SessionSubscribe",
  "ApprovalResponse",
  "SendPrompt",
  "InterruptSession",
  "ResumeDesktopControl",
] as const;

export const EVENT_MESSAGE_TYPE_VALUES = [
  "DeviceRegistered",
  "SessionSummary",
  "SessionOutputDelta",
  "SessionStateChanged",
  "ApprovalRequested",
] as const;

export const RESPONSE_MESSAGE_TYPE_VALUES = ["Ack", "ErrorEnvelope"] as const;

export type CommandMessageType = (typeof COMMAND_MESSAGE_TYPE_VALUES)[number];
export type EventMessageType = (typeof EVENT_MESSAGE_TYPE_VALUES)[number];
export type ResponseMessageType = (typeof RESPONSE_MESSAGE_TYPE_VALUES)[number];
