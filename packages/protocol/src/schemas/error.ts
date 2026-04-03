import { z } from "zod";

import { ERROR_CODE_VALUES } from "../errors/codes.ts";
import { createEnvelopeSchema } from "./envelope.ts";

export const errorCodeSchema = z.enum(ERROR_CODE_VALUES);

export const errorPayloadSchema = z.object({
  code: errorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean().default(false),
  details: z.record(z.unknown()).optional()
});

export const errorEnvelopeSchema = createEnvelopeSchema(
  "ErrorEnvelope",
  errorPayloadSchema
);

export type ErrorPayload = z.infer<typeof errorPayloadSchema>;
