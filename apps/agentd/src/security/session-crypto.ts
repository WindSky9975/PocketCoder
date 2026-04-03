import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  randomBytes,
} from "node:crypto";

import type { EncryptedPayload } from "@pocketcoder/protocol";

import { loadPersistedDeviceKeyRecord } from "./device-keys.js";

function decodePublicKey(publicKey: string) {
  if (publicKey.includes("BEGIN PUBLIC KEY")) {
    return createPublicKey(publicKey);
  }

  return createPublicKey({
    key: Buffer.from(publicKey, "base64"),
    format: "der",
    type: "spki",
  });
}

function createAad(args: {
  type: string;
  messageId: string;
  sessionId: string;
}): Buffer {
  return Buffer.from(`${args.type}:${args.messageId}:${args.sessionId}`, "utf8");
}

function deriveTransportKey(args: {
  runtimeRoot: string;
  remotePublicKey: string;
  senderDeviceId: string;
  recipientDeviceId: string;
}): Buffer {
  const deviceKey = loadPersistedDeviceKeyRecord({
    runtimeRoot: args.runtimeRoot,
  });
  const sharedSecret = diffieHellman({
    privateKey: createPrivateKey(deviceKey.privateKey),
    publicKey: decodePublicKey(args.remotePublicKey),
  });

  return createHash("sha256")
    .update(sharedSecret)
    .update(Buffer.from(`${args.senderDeviceId}:${args.recipientDeviceId}`, "utf8"))
    .digest();
}

export function encryptAgentdPayload(args: {
  runtimeRoot: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  recipientPublicKey: string;
  type: string;
  messageId: string;
  sessionId: string;
  plaintext: unknown;
}): EncryptedPayload {
  const key = deriveTransportKey({
    runtimeRoot: args.runtimeRoot,
    remotePublicKey: args.recipientPublicKey,
    senderDeviceId: args.senderDeviceId,
    recipientDeviceId: args.recipientDeviceId,
  });
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const aad = createAad({
    type: args.type,
    messageId: args.messageId,
    sessionId: args.sessionId,
  });
  cipher.setAAD(aad);
  const plaintext = Buffer.from(JSON.stringify(args.plaintext), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    senderDeviceId: args.senderDeviceId,
    recipientDeviceId: args.recipientDeviceId,
    algorithm: "p256-sha256-aes-256-gcm",
    nonce: nonce.toString("base64"),
    ciphertext: Buffer.concat([ciphertext, authTag]).toString("base64"),
  };
}

export function decryptAgentdPayload<T>(args: {
  runtimeRoot: string;
  remotePublicKey: string;
  type: string;
  messageId: string;
  sessionId: string;
  encrypted: EncryptedPayload;
}): T {
  const key = deriveTransportKey({
    runtimeRoot: args.runtimeRoot,
    remotePublicKey: args.remotePublicKey,
    senderDeviceId: args.encrypted.senderDeviceId,
    recipientDeviceId: args.encrypted.recipientDeviceId,
  });
  const encryptedBytes = Buffer.from(args.encrypted.ciphertext, "base64");
  const authTagLength = 16;
  const ciphertext = encryptedBytes.subarray(0, encryptedBytes.length - authTagLength);
  const authTag = encryptedBytes.subarray(encryptedBytes.length - authTagLength);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(args.encrypted.nonce, "base64"),
  );
  decipher.setAAD(
    createAad({
      type: args.type,
      messageId: args.messageId,
      sessionId: args.sessionId,
    }),
  );
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}
