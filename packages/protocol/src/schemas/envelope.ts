import { z } from "zod";

import { MESSAGE_TYPE_VALUES, type MessageType } from "../constants/message-types.ts";
import { PROTOCOL_VERSION } from "../constants/protocol-version.ts";

export const protocolVersionSchema = z.literal(PROTOCOL_VERSION);
export const messageIdSchema = z.string().min(1);
export const timestampSchema = z.string().datetime({ offset: true });
export const messageTypeSchema = z.enum(MESSAGE_TYPE_VALUES);

export const baseEnvelopeSchema = z.object({
  protocolVersion: protocolVersionSchema,
  messageId: messageIdSchema,
  timestamp: timestampSchema,
  type: messageTypeSchema,
  payload: z.unknown()
});

export const createEnvelopeSchema = <
  TType extends MessageType,
  TPayload extends z.ZodTypeAny
>(type: TType, payloadSchema: TPayload) =>
  z.object({
    protocolVersion: protocolVersionSchema,
    messageId: messageIdSchema,
    timestamp: timestampSchema,
    type: z.literal(type),
    payload: payloadSchema
  });

export type BaseEnvelope = z.infer<typeof baseEnvelopeSchema>;
