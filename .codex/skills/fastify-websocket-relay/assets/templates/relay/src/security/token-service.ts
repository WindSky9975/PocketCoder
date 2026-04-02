import { createHash } from "node:crypto";

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
  expiresAt?: string;
  reason?: "invalid" | "expired" | "used";
}

interface ParsedPairingToken {
  desktopDeviceId: string;
  expiresAt: string | null;
}

function decodeStructuredToken(token: string): ParsedPairingToken | null {
  if (!token.startsWith("pair.v1.")) {
    return null;
  }

  const encodedPayload = token.slice("pair.v1.".length);
  try {
    const raw = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as {
      desktopDeviceId?: unknown;
      expiresAt?: unknown;
    };

    if (typeof payload.desktopDeviceId !== "string") {
      return null;
    }

    if (typeof payload.expiresAt !== "string") {
      return null;
    }

    return {
      desktopDeviceId: payload.desktopDeviceId.trim(),
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

function decodeLegacyToken(token: string): ParsedPairingToken | null {
  const match = /^pair-(.+)-placeholder$/.exec(token);
  if (!match?.[1]) {
    return null;
  }

  return {
    desktopDeviceId: match[1],
    expiresAt: null,
  };
}

function parsePairingToken(token: string): ParsedPairingToken | null {
  return decodeStructuredToken(token) ?? decodeLegacyToken(token);
}

function hashPairingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function ensurePairingRecord(
  repository: PairingRecordRepository,
  token: string,
  nowIso: string,
): PairingRecord | null {
  const tokenHash = hashPairingToken(token);
  const existing = repository.get(tokenHash);
  if (existing) {
    return existing;
  }

  const parsed = parsePairingToken(token);
  if (!parsed) {
    return null;
  }

  const expiresAt =
    parsed.expiresAt ?? new Date(Date.parse(nowIso) + 5 * 60 * 1000).toISOString();

  return repository.save(createEmptyPairingRecord(tokenHash, parsed.desktopDeviceId, expiresAt));
}

export function canConsumePairingToken(record: PairingTokenRecord, nowIso: string): boolean {
  return record.usedAt === null && Date.parse(nowIso) < Date.parse(record.expiresAt);
}

export function inspectPairingToken(
  repository: PairingRecordRepository,
  token: string,
  nowIso = new Date().toISOString(),
): PairingTokenInspection {
  const record = ensurePairingRecord(repository, token, nowIso);
  if (!record) {
    return { accepted: false, reason: "invalid" };
  }

  if (record.usedAt !== null) {
    return {
      accepted: false,
      desktopDeviceId: record.desktopDeviceId,
      expiresAt: record.expiresAt,
      reason: "used",
    };
  }

  if (Date.parse(nowIso) >= Date.parse(record.expiresAt)) {
    return {
      accepted: false,
      desktopDeviceId: record.desktopDeviceId,
      expiresAt: record.expiresAt,
      reason: "expired",
    };
  }

  return {
    accepted: true,
    desktopDeviceId: record.desktopDeviceId,
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
  const record = ensurePairingRecord(repository, args.token, nowIso);

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
        expiresAt: record.expiresAt,
        usedAt: record.usedAt,
      },
    });
  }

  const consumed: PairingRecord = {
    ...record,
    candidateDeviceId: args.candidateDeviceId,
    candidateDeviceName: args.candidateDeviceName,
    candidatePublicKey: args.candidatePublicKey,
    usedAt: nowIso,
  };

  return repository.save(consumed);
}
