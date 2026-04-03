import { z } from "zod";

import { SESSION_STATUS_VALUES } from "../constants/session-status.ts";
import { createEnvelopeSchema } from "./envelope.ts";

export const sessionStatusSchema = z.enum(SESSION_STATUS_VALUES);

export const sessionSummaryPayloadSchema = z.object({
  sessionId: z.string().min(1),
  provider: z.string().min(1),
  status: sessionStatusSchema,
  currentTask: z.string().min(1).optional(),
  lastActivityAt: z.string().datetime({ offset: true })
});

export const sessionSubscribePayloadSchema = z.object({
  sessionId: z.string().min(1)
});

export const sessionOutputDeltaPayloadSchema = z.object({
  sessionId: z.string().min(1),
  stream: z.enum(["stdout", "stderr"]),
  delta: z.string()
});

export const sessionStateChangedPayloadSchema = z.object({
  sessionId: z.string().min(1),
  status: sessionStatusSchema,
  reason: z.string().optional()
});

export const approvalRequestedPayloadSchema = z.object({
  sessionId: z.string().min(1),
  approvalId: z.string().min(1),
  prompt: z.string().min(1),
  issuedAt: z.string().datetime({ offset: true })
});

export const sessionDirectoryResponseSchema = z.object({
  sessions: z.array(sessionSummaryPayloadSchema)
});

export const sessionSummaryEnvelopeSchema = createEnvelopeSchema(
  "SessionSummary",
  sessionSummaryPayloadSchema
);
export const sessionSubscribeEnvelopeSchema = createEnvelopeSchema(
  "SessionSubscribe",
  sessionSubscribePayloadSchema
);
export const sessionOutputDeltaEnvelopeSchema = createEnvelopeSchema(
  "SessionOutputDelta",
  sessionOutputDeltaPayloadSchema
);
export const sessionStateChangedEnvelopeSchema = createEnvelopeSchema(
  "SessionStateChanged",
  sessionStateChangedPayloadSchema
);
export const approvalRequestedEnvelopeSchema = createEnvelopeSchema(
  "ApprovalRequested",
  approvalRequestedPayloadSchema
);

export type SessionSummaryPayload = z.infer<typeof sessionSummaryPayloadSchema>;
export type SessionSubscribePayload = z.infer<typeof sessionSubscribePayloadSchema>;
export type SessionOutputDeltaPayload = z.infer<typeof sessionOutputDeltaPayloadSchema>;
export type SessionStateChangedPayload = z.infer<typeof sessionStateChangedPayloadSchema>;
export type ApprovalRequestedPayload = z.infer<typeof approvalRequestedPayloadSchema>;
export type SessionDirectoryResponse = z.infer<typeof sessionDirectoryResponseSchema>;
