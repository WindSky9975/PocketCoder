export interface CipherEnvelope {
  senderDeviceId: string;
  ciphertext: string;
  nonce: string;
}

export function wrapEncryptedPayload(senderDeviceId: string, ciphertext: string): CipherEnvelope {
  return {
    senderDeviceId,
    ciphertext,
    nonce: "placeholder-nonce",
  };
}