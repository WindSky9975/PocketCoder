import { z } from "zod";

import { createEnvelopeSchema } from "./envelope.ts";

export const pairingInitPayloadSchema = z.object({
  pairingToken: z.string().min(1),
  deviceName: z.string().min(1),
  publicKey: z.string().min(1)
});

export const pairingConfirmPayloadSchema = z.object({
  pairingToken: z.string().min(1),
  approvalCode: z.string().min(1),
  publicKey: z.string().min(1)
});

export const deviceRegisteredPayloadSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  registeredAt: z.string().datetime({ offset: true })
});

export const pairingInitEnvelopeSchema = createEnvelopeSchema(
  "PairingInit",
  pairingInitPayloadSchema
);
export const pairingConfirmEnvelopeSchema = createEnvelopeSchema(
  "PairingConfirm",
  pairingConfirmPayloadSchema
);
export const deviceRegisteredEnvelopeSchema = createEnvelopeSchema(
  "DeviceRegistered",
  deviceRegisteredPayloadSchema
);

export type PairingInitPayload = z.infer<typeof pairingInitPayloadSchema>;
export type PairingConfirmPayload = z.infer<typeof pairingConfirmPayloadSchema>;
export type DeviceRegisteredPayload = z.infer<typeof deviceRegisteredPayloadSchema>;
