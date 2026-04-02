import { randomBytes } from "node:crypto";

export interface CipherEnvelope {
  senderDeviceId: string;
  ciphertext: string;
  nonce: string;
}

export function wrapEncryptedPayload(senderDeviceId: string, ciphertext: string): CipherEnvelope {
  return {
    senderDeviceId,
    ciphertext,
    nonce: randomBytes(12).toString("base64url"),
  };
}
