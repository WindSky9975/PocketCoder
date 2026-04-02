import {
  PROTOCOL_VERSION,
  ackEnvelopeSchema,
  createMessageId,
  errorEnvelopeSchema,
  type ProtocolErrorCode,
} from "@pocketcoder/protocol";

export function createAckEnvelope(
  acknowledgedMessageId: string,
  accepted: boolean,
  detail?: string,
  timestamp = new Date().toISOString(),
) {
  return ackEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    messageId: createMessageId("ack"),
    timestamp,
    type: "Ack",
    payload: {
      acknowledgedMessageId,
      accepted,
      ...(detail ? { detail } : {}),
    },
  });
}

export function createErrorEnvelope(
  code: ProtocolErrorCode,
  message: string,
  details?: Record<string, unknown>,
  timestamp = new Date().toISOString(),
) {
  return errorEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    messageId: createMessageId("err"),
    timestamp,
    type: "ErrorEnvelope",
    payload: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}
