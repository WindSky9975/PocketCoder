export interface BrowserDeviceKeyRecord {
  deviceId: string;
  publicKey: string;
  publicKeyAlgorithm: "ecdsa-p256";
  publicKeyFingerprint: string;
  privateKeyRef: string;
  pairedAt: string | null;
}

export interface BrowserKeyStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface PersistedBrowserKeyRecord {
  deviceId: string;
  publicKey: string;
  privateKey: string;
}

const BROWSER_KEY_STORAGE_KEY = "pocketcoder.browser-key:default";

function resolveBrowserStorage(storage?: BrowserKeyStorageLike): BrowserKeyStorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(binary);
  }

  throw new Error("base64 encoding is not available in this runtime");
}

function bufferToBase64(value: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(value));
}

async function computePublicKeyFingerprint(publicKey: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(publicKey),
  );
  return bufferToBase64(digest).slice(0, 16);
}

async function exportBrowserKeyPair(keyPair: CryptoKeyPair): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const [publicKey, privateKey] = await Promise.all([
    globalThis.crypto.subtle.exportKey("spki", keyPair.publicKey),
    globalThis.crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  return {
    publicKey: bufferToBase64(publicKey),
    privateKey: bufferToBase64(privateKey),
  };
}

async function generatePersistedBrowserKeyRecord(deviceId: string): Promise<PersistedBrowserKeyRecord> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is not available in this runtime");
  }

  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  );
  const exported = await exportBrowserKeyPair(keyPair);

  return {
    deviceId,
    publicKey: exported.publicKey,
    privateKey: exported.privateKey,
  };
}

export function createBrowserDeviceKeyRecord(deviceId: string): BrowserDeviceKeyRecord {
  const publicKey = `test-browser-public-key:${deviceId}`;

  return {
    deviceId,
    publicKey,
    publicKeyAlgorithm: "ecdsa-p256",
    publicKeyFingerprint: publicKey.slice(0, 16),
    privateKeyRef: `browser-secure-store://tests/${deviceId}`,
    pairedAt: null,
  };
}

export async function loadOrCreateBrowserDeviceKeyRecord(args: {
  deviceId: string;
  storage?: BrowserKeyStorageLike;
}): Promise<BrowserDeviceKeyRecord> {
  const storage = resolveBrowserStorage(args.storage);
  if (!storage) {
    throw new Error("browser secure storage is not available");
  }

  const raw = storage.getItem(BROWSER_KEY_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as Partial<PersistedBrowserKeyRecord>;
    if (
      typeof parsed.deviceId === "string" &&
      typeof parsed.publicKey === "string" &&
      typeof parsed.privateKey === "string"
    ) {
      const fingerprint = await computePublicKeyFingerprint(parsed.publicKey);
      return {
        deviceId: parsed.deviceId,
        publicKey: parsed.publicKey,
        publicKeyAlgorithm: "ecdsa-p256",
        publicKeyFingerprint: fingerprint,
        privateKeyRef: `browser-secure-store://${BROWSER_KEY_STORAGE_KEY}`,
        pairedAt: null,
      };
    }
  }

  const created = await generatePersistedBrowserKeyRecord(args.deviceId);
  storage.setItem(BROWSER_KEY_STORAGE_KEY, JSON.stringify(created));
  const fingerprint = await computePublicKeyFingerprint(created.publicKey);

  return {
    deviceId: created.deviceId,
    publicKey: created.publicKey,
    publicKeyAlgorithm: "ecdsa-p256",
    publicKeyFingerprint: fingerprint,
    privateKeyRef: `browser-secure-store://${BROWSER_KEY_STORAGE_KEY}`,
    pairedAt: null,
  };
}
