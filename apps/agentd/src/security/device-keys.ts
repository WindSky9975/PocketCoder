import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface DeviceKeyRecord {
  deviceId: string;
  publicKey: string;
  publicKeyFingerprint: string;
  publicKeyAlgorithm: "ecdsa-p256";
  privateKeyRef: string;
  createdAt: string;
}

interface PersistedDeviceKeyRecord {
  deviceId: string;
  publicKey: string;
  privateKey: string;
  createdAt: string;
}

const DEVICE_KEY_DIRECTORY = "security";
const DEVICE_KEY_FILENAME = "device-key.json";

function createPublicKeyFingerprint(publicKey: string): string {
  return createHash("sha256").update(publicKey).digest("hex").slice(0, 16);
}

function createPersistedDeviceKeyRecord(deviceId: string): PersistedDeviceKeyRecord {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });

  return {
    deviceId,
    publicKey,
    privateKey,
    createdAt: new Date().toISOString(),
  };
}

function resolveDeviceKeyPath(runtimeRoot: string): string {
  return path.join(runtimeRoot, DEVICE_KEY_DIRECTORY, DEVICE_KEY_FILENAME);
}

function normalizePersistedRecord(record: PersistedDeviceKeyRecord): DeviceKeyRecord {
  return {
    deviceId: record.deviceId,
    publicKey: record.publicKey,
    publicKeyFingerprint: createPublicKeyFingerprint(record.publicKey),
    publicKeyAlgorithm: "ecdsa-p256",
    privateKeyRef: `file://${DEVICE_KEY_DIRECTORY}/${DEVICE_KEY_FILENAME}`,
    createdAt: record.createdAt,
  };
}

function readPersistedDeviceKeyRecord(filePath: string): PersistedDeviceKeyRecord | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<PersistedDeviceKeyRecord>;
  if (
    typeof parsed.deviceId !== "string" ||
    typeof parsed.publicKey !== "string" ||
    typeof parsed.privateKey !== "string" ||
    typeof parsed.createdAt !== "string"
  ) {
    return null;
  }

  return {
    deviceId: parsed.deviceId,
    publicKey: parsed.publicKey,
    privateKey: parsed.privateKey,
    createdAt: parsed.createdAt,
  };
}

function writePersistedDeviceKeyRecord(filePath: string, record: PersistedDeviceKeyRecord): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf8");
}

export function loadOrCreateDeviceKeyRecord(args: {
  runtimeRoot: string;
  deviceId: string;
}): DeviceKeyRecord {
  const filePath = resolveDeviceKeyPath(args.runtimeRoot);
  const existing = readPersistedDeviceKeyRecord(filePath);
  if (existing) {
    return normalizePersistedRecord(existing);
  }

  const created = createPersistedDeviceKeyRecord(args.deviceId);
  writePersistedDeviceKeyRecord(filePath, created);
  return normalizePersistedRecord(created);
}

export function signPayloadWithDeviceKey(args: {
  runtimeRoot: string;
  payload: string;
}): string {
  const filePath = resolveDeviceKeyPath(args.runtimeRoot);
  const record = readPersistedDeviceKeyRecord(filePath);
  if (!record) {
    throw new Error("device key record is missing");
  }

  const privateKey = createPrivateKey(record.privateKey);
  return sign("sha256", Buffer.from(args.payload, "utf8"), privateKey).toString("base64url");
}

export function verifyDeviceSignature(args: {
  publicKey: string;
  payload: string;
  signature: string;
}): boolean {
  try {
    const publicKey = createPublicKey(args.publicKey);
    return verify(
      "sha256",
      Buffer.from(args.payload, "utf8"),
      publicKey,
      Buffer.from(args.signature, "base64url"),
    );
  } catch {
    return false;
  }
}
