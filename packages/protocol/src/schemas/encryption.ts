import { z } from "zod";

export const encryptedPayloadSchema = z.object({
  senderDeviceId: z.string().min(1),
  recipientDeviceId: z.string().min(1),
  algorithm: z.literal("p256-sha256-aes-256-gcm"),
  nonce: z.string().min(1),
  ciphertext: z.string().min(1),
});

export type EncryptedPayload = z.infer<typeof encryptedPayloadSchema>;
