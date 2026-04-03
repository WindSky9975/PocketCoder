import { createPublicKey, verify } from "node:crypto";

import { RelayProtocolError } from "../infra/protocol-error.js";
import type { RelayDeviceRole } from "../storage/repositories/device-record-repository.js";

const DEFAULT_DEVICE_PROOF_MAX_AGE_MS = 5 * 60_000;

function createDeviceProofPayload(args: {
  deviceId: string;
  role: RelayDeviceRole;
  timestamp: string;
}): string {
  return JSON.stringify(args);
}

function resolvePublicKey(publicKey: string) {
  try {
    return createPublicKey(publicKey);
  } catch {
    return createPublicKey({
      key: Buffer.from(publicKey, "base64"),
      format: "der",
      type: "spki",
    });
  }
}

export function verifyDeviceProof(args: {
  deviceId: string;
  role: RelayDeviceRole;
  timestamp: string;
  signature: string;
  publicKey: string;
  nowIso?: string;
  maxAgeMs?: number;
}): boolean {
  const nowMs = Date.parse(args.nowIso ?? new Date().toISOString());
  const timestampMs = Date.parse(args.timestamp);
  if (!Number.isFinite(nowMs) || !Number.isFinite(timestampMs)) {
    return false;
  }

  const maxAgeMs = args.maxAgeMs ?? DEFAULT_DEVICE_PROOF_MAX_AGE_MS;
  if (Math.abs(nowMs - timestampMs) > maxAgeMs) {
    return false;
  }

  try {
    const payload = Buffer.from(
      createDeviceProofPayload({
        deviceId: args.deviceId,
        role: args.role,
        timestamp: args.timestamp,
      }),
      "utf8",
    );
    const signature = Buffer.from(args.signature, "base64url");
    const publicKey = resolvePublicKey(args.publicKey);

    if (verify("sha256", payload, publicKey, signature)) {
      return true;
    }

    return verify(
      "sha256",
      payload,
      {
        key: publicKey,
        dsaEncoding: "ieee-p1363",
      },
      signature,
    );
  } catch {
    return false;
  }
}

export function assertValidDeviceProof(args: {
  deviceId?: string;
  role: RelayDeviceRole;
  timestamp?: string;
  signature?: string;
  publicKey?: string;
  nowIso?: string;
  maxAgeMs?: number;
}): void {
  if (!args.deviceId || !args.timestamp || !args.signature || !args.publicKey) {
    throw new RelayProtocolError({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "device proof is missing",
      details: {
        deviceId: args.deviceId,
        role: args.role,
      },
    });
  }

  if (
    !verifyDeviceProof({
      deviceId: args.deviceId,
      role: args.role,
      timestamp: args.timestamp,
      signature: args.signature,
      publicKey: args.publicKey,
      nowIso: args.nowIso,
      maxAgeMs: args.maxAgeMs,
    })
  ) {
    throw new RelayProtocolError({
      code: "UNAUTHORIZED",
      statusCode: 403,
      message: "device proof is invalid",
      details: {
        deviceId: args.deviceId,
        role: args.role,
      },
    });
  }
}
