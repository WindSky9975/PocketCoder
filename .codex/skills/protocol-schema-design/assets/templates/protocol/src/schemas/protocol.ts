import { z } from "zod";

import {
  ackEnvelopeSchema,
  approvalResponseEnvelopeSchema,
  interruptSessionEnvelopeSchema,
  resumeDesktopControlEnvelopeSchema,
  sendPromptEnvelopeSchema,
} from "./command.js";
import { errorEnvelopeSchema } from "./error.js";
import {
  deviceRegisteredEnvelopeSchema,
  pairingConfirmEnvelopeSchema,
  pairingInitEnvelopeSchema,
} from "./pairing.js";
import {
  approvalRequestedEnvelopeSchema,
  sessionOutputDeltaEnvelopeSchema,
  sessionStateChangedEnvelopeSchema,
  sessionSubscribeEnvelopeSchema,
  sessionSummaryEnvelopeSchema,
} from "./session.js";

export const protocolCommandEnvelopeSchema = z.discriminatedUnion("type", [
  pairingInitEnvelopeSchema,
  pairingConfirmEnvelopeSchema,
  sessionSubscribeEnvelopeSchema,
  approvalResponseEnvelopeSchema,
  sendPromptEnvelopeSchema,
  interruptSessionEnvelopeSchema,
  resumeDesktopControlEnvelopeSchema,
]);

export const protocolEventEnvelopeSchema = z.discriminatedUnion("type", [
  deviceRegisteredEnvelopeSchema,
  sessionSummaryEnvelopeSchema,
  sessionOutputDeltaEnvelopeSchema,
  sessionStateChangedEnvelopeSchema,
  approvalRequestedEnvelopeSchema,
]);

export const protocolResponseEnvelopeSchema = z.discriminatedUnion("type", [
  ackEnvelopeSchema,
  errorEnvelopeSchema,
]);

export const protocolEnvelopeSchema = z.discriminatedUnion("type", [
  pairingInitEnvelopeSchema,
  pairingConfirmEnvelopeSchema,
  deviceRegisteredEnvelopeSchema,
  sessionSummaryEnvelopeSchema,
  sessionSubscribeEnvelopeSchema,
  sessionOutputDeltaEnvelopeSchema,
  sessionStateChangedEnvelopeSchema,
  approvalRequestedEnvelopeSchema,
  approvalResponseEnvelopeSchema,
  sendPromptEnvelopeSchema,
  interruptSessionEnvelopeSchema,
  resumeDesktopControlEnvelopeSchema,
  ackEnvelopeSchema,
  errorEnvelopeSchema,
]);

export function parseProtocolEnvelope(input: unknown): ProtocolEnvelope {
  return protocolEnvelopeSchema.parse(input);
}

export type ProtocolCommandEnvelope = z.infer<typeof protocolCommandEnvelopeSchema>;
export type ProtocolEventEnvelope = z.infer<typeof protocolEventEnvelopeSchema>;
export type ProtocolResponseEnvelope = z.infer<typeof protocolResponseEnvelopeSchema>;
export type ProtocolEnvelope = z.infer<typeof protocolEnvelopeSchema>;
