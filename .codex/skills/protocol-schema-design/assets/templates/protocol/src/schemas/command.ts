import { z } from "zod";

import { messageIdSchema, createEnvelopeSchema } from "./envelope.js";

export const approvalDecisionSchema = z.enum(["allow", "deny"]);

export const approvalResponsePayloadSchema = z.object({
  sessionId: z.string().min(1),
  approvalId: z.string().min(1),
  decision: approvalDecisionSchema
});

export const sendPromptPayloadSchema = z.object({
  sessionId: z.string().min(1),
  prompt: z.string().min(1)
});

export const interruptSessionPayloadSchema = z.object({
  sessionId: z.string().min(1),
  reason: z.string().optional()
});

export const resumeDesktopControlPayloadSchema = z.object({
  sessionId: z.string().min(1),
  requestedBy: z.string().min(1).optional()
});

export const ackPayloadSchema = z.object({
  acknowledgedMessageId: messageIdSchema,
  accepted: z.boolean(),
  detail: z.string().optional()
});

export const approvalResponseEnvelopeSchema = createEnvelopeSchema(
  "ApprovalResponse",
  approvalResponsePayloadSchema
);
export const sendPromptEnvelopeSchema = createEnvelopeSchema(
  "SendPrompt",
  sendPromptPayloadSchema
);
export const interruptSessionEnvelopeSchema = createEnvelopeSchema(
  "InterruptSession",
  interruptSessionPayloadSchema
);
export const resumeDesktopControlEnvelopeSchema = createEnvelopeSchema(
  "ResumeDesktopControl",
  resumeDesktopControlPayloadSchema
);
export const ackEnvelopeSchema = createEnvelopeSchema("Ack", ackPayloadSchema);

export type ApprovalResponsePayload = z.infer<typeof approvalResponsePayloadSchema>;
export type SendPromptPayload = z.infer<typeof sendPromptPayloadSchema>;
export type InterruptSessionPayload = z.infer<typeof interruptSessionPayloadSchema>;
export type ResumeDesktopControlPayload = z.infer<typeof resumeDesktopControlPayloadSchema>;
export type AckPayload = z.infer<typeof ackPayloadSchema>;