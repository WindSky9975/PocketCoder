import type { EncryptedPayload } from "@pocketcoder/protocol";

import {
  loadPersistedBrowserKeyRecord,
  type BrowserKeyStorageLike,
} from "./device-keyring.ts";

function ensureWebCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto is not available in this runtime");
  }

  return subtle;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  if (typeof globalThis.btoa !== "function") {
    throw new Error("base64 encoding is not available in this runtime");
  }

  return globalThis.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof globalThis.atob !== "function") {
    throw new Error("base64 decoding is not available in this runtime");
  }

  const binary = globalThis.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bufferToBytes(value: ArrayBuffer): Uint8Array {
  return new Uint8Array(value);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return combined;
}

function decodePemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----/gu, "").replace(/-----END [^-]+-----/gu, "").replace(/\s+/gu, "");
  return base64ToBytes(body);
}

function decodePublicKey(publicKey: string): Uint8Array {
  return publicKey.includes("BEGIN PUBLIC KEY")
    ? decodePemToDer(publicKey)
    : base64ToBytes(publicKey);
}

function createAad(args: {
  type: string;
  messageId: string;
  sessionId: string;
}): ArrayBuffer {
  return toArrayBuffer(
    new TextEncoder().encode(`${args.type}:${args.messageId}:${args.sessionId}`),
  );
}

async function importBrowserPrivateKey(
  privateKeyBase64: string,
): Promise<CryptoKey> {
  return ensureWebCrypto().importKey(
    "pkcs8",
    toArrayBuffer(base64ToBytes(privateKeyBase64)),
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    false,
    ["deriveBits"],
  );
}

async function importRemotePublicKey(
  publicKey: string,
): Promise<CryptoKey> {
  return ensureWebCrypto().importKey(
    "spki",
    toArrayBuffer(decodePublicKey(publicKey)),
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    false,
    [],
  );
}

async function deriveTransportKey(args: {
  privateKeyBase64: string;
  remotePublicKey: string;
  senderDeviceId: string;
  recipientDeviceId: string;
}): Promise<CryptoKey> {
  const subtle = ensureWebCrypto();
  const [privateKey, publicKey] = await Promise.all([
    importBrowserPrivateKey(args.privateKeyBase64),
    importRemotePublicKey(args.remotePublicKey),
  ]);
  const sharedSecret = await subtle.deriveBits(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    256,
  );
  const context = concatBytes([
    bufferToBytes(sharedSecret),
    new TextEncoder().encode(`${args.senderDeviceId}:${args.recipientDeviceId}`),
  ]);
  const digest = await subtle.digest("SHA-256", toArrayBuffer(context));

  return subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptBrowserPayload(args: {
  senderDeviceId: string;
  recipientDeviceId: string;
  recipientPublicKey: string;
  type: string;
  messageId: string;
  sessionId: string;
  plaintext: unknown;
  storage?: BrowserKeyStorageLike;
}): Promise<EncryptedPayload> {
  const subtle = ensureWebCrypto();
  const keyRecord = loadPersistedBrowserKeyRecord({
    storage: args.storage,
  });
  const aesKey = await deriveTransportKey({
    privateKeyBase64: keyRecord.privateKey,
    remotePublicKey: args.recipientPublicKey,
    senderDeviceId: args.senderDeviceId,
    recipientDeviceId: args.recipientDeviceId,
  });
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(nonce),
      additionalData: createAad({
        type: args.type,
        messageId: args.messageId,
        sessionId: args.sessionId,
      }),
    },
    aesKey,
    toArrayBuffer(new TextEncoder().encode(JSON.stringify(args.plaintext))),
  );

  return {
    senderDeviceId: args.senderDeviceId,
    recipientDeviceId: args.recipientDeviceId,
    algorithm: "p256-sha256-aes-256-gcm",
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(bufferToBytes(ciphertext)),
  };
}

export async function decryptBrowserPayload<T>(args: {
  remotePublicKey: string;
  type: string;
  messageId: string;
  sessionId: string;
  encrypted: EncryptedPayload;
  storage?: BrowserKeyStorageLike;
}): Promise<T> {
  const subtle = ensureWebCrypto();
  const keyRecord = loadPersistedBrowserKeyRecord({
    storage: args.storage,
  });
  const aesKey = await deriveTransportKey({
    privateKeyBase64: keyRecord.privateKey,
    remotePublicKey: args.remotePublicKey,
    senderDeviceId: args.encrypted.senderDeviceId,
    recipientDeviceId: args.encrypted.recipientDeviceId,
  });
  const plaintext = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(base64ToBytes(args.encrypted.nonce)),
      additionalData: createAad({
        type: args.type,
        messageId: args.messageId,
        sessionId: args.sessionId,
      }),
    },
    aesKey,
    toArrayBuffer(base64ToBytes(args.encrypted.ciphertext)),
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
