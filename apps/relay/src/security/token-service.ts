import { createHash, createPublicKey, verify } from "node:crypto";

import { RelayProtocolError } from "../infra/protocol-error.js";
import {
  createEmptyPairingRecord,
  type PairingRecord,
  type PairingRecordRepository,
} from "../storage/repositories/pairing-record-repository.js";

export interface PairingTokenRecord {
  tokenHash: string;
  desktopDeviceId: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface PairingTokenInspection {
  accepted: boolean;
  desktopDeviceId?: string;
  desktopPublicKey?: string;
  expiresAt?: string;
  reason?: "invalid" | "expired" | "used" | "untrusted";
}

interface ParsedPairingToken {
  desktopDeviceId: string;
  desktopPublicKey: string;
  expiresAt: string;
  signature: string;
  payloadJson: string;
}

function hashPairingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function verifyPairingTokenSignature(args: {
  publicKey: string;
  payload: string;
  signature: string;
}): boolean {
  try {
    return verify(
      "sha256",
      Buffer.from(args.payload, "utf8"),
      createPublicKey(args.publicKey),
      Buffer.from(args.signature, "base64url"),
    );
  } catch {
    return false;
  }
}

function parseSignedPairingToken(token: string): ParsedPairingToken | null {
  if (!token.startsWith("pair.v1.")) {
    return null;
  }

  const parts = token.split(".");
  const encodedPayload = parts[2];
  const signature = parts[3];
  if (parts.length !== 4 || typeof encodedPayload !== "string" || typeof signature !== "string") {
    return null;
  }

  try {
    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as {
      desktopDeviceId?: unknown;
      desktopPublicKey?: unknown;
      expiresAt?: unknown;
      tokenId?: unknown;
    };

    if (
      typeof payload.desktopDeviceId !== "string" ||
      typeof payload.desktopPublicKey !== "string" ||
      typeof payload.expiresAt !== "string" ||
      typeof payload.tokenId !== "string" ||
      typeof signature !== "string" ||
      signature.length < 16
    ) {
      return null;
    }

    return {
      desktopDeviceId: payload.desktopDeviceId.trim(),
      desktopPublicKey: payload.desktopPublicKey,
      expiresAt: payload.expiresAt,
      signature,
      payloadJson,
    };
  } catch {
    return null;
  }
}

function ensurePairingRecord(
  repository: PairingRecordRepository,
  token: string,
  desktopPublicKey: string,
  desktopDeviceId: string,
  expiresAt: string,
): PairingRecord {
  const tokenHash = hashPairingToken(token);
  const existing = repository.get(tokenHash);
  if (existing) {
    return existing;
  }

  return repository.save(
    createEmptyPairingRecord(tokenHash, desktopDeviceId, desktopPublicKey, expiresAt),
  );
}

export function canConsumePairingToken(record: PairingTokenRecord, nowIso: string): boolean {
  return record.usedAt === null && Date.parse(nowIso) < Date.parse(record.expiresAt);
}

export function inspectPairingToken(
  repository: PairingRecordRepository,
  token: string,
  nowIso = new Date().toISOString(),
): PairingTokenInspection {
  const parsed = parseSignedPairingToken(token);
  if (!parsed) {
    return { accepted: false, reason: "invalid" };
  }

  const isTrusted = verifyPairingTokenSignature({
    publicKey: parsed.desktopPublicKey,
    payload: parsed.payloadJson,
    signature: parsed.signature,
  });
  if (!isTrusted) {
    return {
      accepted: false,
      desktopDeviceId: parsed.desktopDeviceId,
      desktopPublicKey: parsed.desktopPublicKey,
      expiresAt: parsed.expiresAt,
      reason: "untrusted",
    };
  }

  const record = ensurePairingRecord(
    repository,
    token,
    parsed.desktopPublicKey,
    parsed.desktopDeviceId,
    parsed.expiresAt,
  );

  if (record.usedAt !== null) {
    return {
      accepted: false,
      desktopDeviceId: record.desktopDeviceId,
      desktopPublicKey: parsed.desktopPublicKey,
      expiresAt: record.expiresAt,
      reason: "used",
    };
  }

  if (Date.parse(nowIso) >= Date.parse(record.expiresAt)) {
    return {
      accepted: false,
      desktopDeviceId: record.desktopDeviceId,
      desktopPublicKey: parsed.desktopPublicKey,
      expiresAt: record.expiresAt,
      reason: "expired",
    };
  }

  return {
    accepted: true,
    desktopDeviceId: record.desktopDeviceId,
    desktopPublicKey: parsed.desktopPublicKey,
    expiresAt: record.expiresAt,
  };
}

export function consumePairingToken(
  repository: PairingRecordRepository,
  args: {
    token: string;
    candidateDeviceId: string;
    candidateDeviceName: string;
    candidatePublicKey: string;
    nowIso?: string;
  },
): PairingRecord {
  const nowIso = args.nowIso ?? new Date().toISOString();
  const inspection = inspectPairingToken(repository, args.token, nowIso);
  const record =
    inspection.accepted && inspection.desktopPublicKey
      ? ensurePairingRecord(
          repository,
          args.token,
          inspection.desktopPublicKey,
          inspection.desktopDeviceId ?? "desktop-device",
          inspection.expiresAt ?? nowIso,
        )
      : null;

  if (!record) {
    throw new RelayProtocolError({
      code: "PAIRING_TOKEN_INVALID",
      statusCode: 404,
      message: "pairing token is invalid",
    });
  }

  if (!canConsumePairingToken(record, nowIso)) {
    throw new RelayProtocolError({
      code: "PAIRING_TOKEN_INVALID",
      statusCode: 409,
      message: "pairing token is no longer valid",
      details: {
        desktopDeviceId: record.desktopDeviceId,
        reason: inspection.reason,
        expiresAt: record.expiresAt,
        usedAt: record.usedAt,
      },
    });
  }

  const consumed: PairingRecord = {
    ...record,
    desktopPublicKey: inspection.desktopPublicKey ?? record.desktopPublicKey,
    candidateDeviceId: args.candidateDeviceId,
    candidateDeviceName: args.candidateDeviceName,
    candidatePublicKey: args.candidatePublicKey,
    usedAt: nowIso,
  };

  return repository.save(consumed);
}
