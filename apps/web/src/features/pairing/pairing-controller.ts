import { PROTOCOL_VERSION, createMessageId } from "@pocketcoder/protocol";

import type { BrowserDeviceKeyRecord } from "../../lib/crypto/device-keyring.ts";
import {
  createStoredPairedDevice,
  type StoredPairedDevice,
} from "../../lib/storage/device-store.ts";

export interface PairingStartInput {
  relayOrigin: string;
  token: string;
  deviceName: string;
  keyRecord: BrowserDeviceKeyRecord;
  fetchImpl?: typeof fetch;
}

export type PairingTokenInspectionReason = "invalid" | "expired" | "used" | "untrusted";

export interface PairingTokenInspectionResult {
  accepted: boolean;
  desktopDeviceId?: string;
  desktopPublicKey?: string;
  expiresAt?: string;
  reason?: PairingTokenInspectionReason;
}

export interface PairingStartPayload {
  pairingToken: string;
  deviceName: string;
  publicKey: string;
}

export interface PairingStartResult {
  pairedDevice: StoredPairedDevice;
  desktopDeviceId: string;
  desktopPublicKey: string;
  grantedScopes: string[];
  registrationEnvelope: {
    payload: {
      deviceId: string;
      deviceName: string;
      registeredAt: string;
    };
  };
}

export function buildPairingStartPayload(input: {
  token: string;
  deviceName: string;
  candidatePublicKey: string;
}): PairingStartPayload {
  return {
    pairingToken: input.token.trim(),
    deviceName: input.deviceName.trim(),
    publicKey: input.candidatePublicKey.trim(),
  };
}

export async function inspectPairingToken(input: {
  relayOrigin: string;
  token: string;
  fetchImpl?: typeof fetch;
}): Promise<PairingTokenInspectionResult> {
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("fetch is not available in this runtime");
  }

  const relayUrl = new URL("/pairing/token", input.relayOrigin);
  relayUrl.searchParams.set("value", input.token.trim());
  const response = await fetchImpl(relayUrl);
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(`pairing failed with status ${response.status}`);
  }

  if (typeof payload !== "object" || payload === null || !("accepted" in payload)) {
    throw new Error("pairing token inspection returned an invalid payload");
  }

  const inspection = payload as Partial<PairingTokenInspectionResult>;
  return {
    accepted: inspection.accepted === true,
    ...(typeof inspection.desktopDeviceId === "string"
      ? { desktopDeviceId: inspection.desktopDeviceId }
      : {}),
    ...(typeof inspection.desktopPublicKey === "string"
      ? { desktopPublicKey: inspection.desktopPublicKey }
      : {}),
    ...(typeof inspection.expiresAt === "string" ? { expiresAt: inspection.expiresAt } : {}),
    ...(typeof inspection.reason === "string" ? { reason: inspection.reason } : {}),
  };
}

export async function startPairing(input: PairingStartInput): Promise<PairingStartResult> {
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("fetch is not available in this runtime");
  }

  const payload = buildPairingStartPayload({
    token: input.token,
    deviceName: input.deviceName,
    candidatePublicKey: input.keyRecord.publicKey,
  });

  const response = await fetchImpl(`${input.relayOrigin}/pairing/init`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      protocolVersion: PROTOCOL_VERSION,
      messageId: createMessageId("pair"),
      timestamp: new Date().toISOString(),
      type: "PairingInit",
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`pairing failed with status ${response.status}`);
  }

  const registration = (await response.json()) as {
    desktopDeviceId: string;
    desktopPublicKey: string;
    grantedScopes: string[];
    envelope: {
      payload: {
        deviceId: string;
        deviceName: string;
        registeredAt: string;
      };
    };
  };

  return {
    pairedDevice: createStoredPairedDevice(
      registration.envelope.payload.deviceId,
      registration.desktopDeviceId,
      registration.desktopPublicKey,
      input.relayOrigin,
      registration.grantedScopes,
    ),
    desktopDeviceId: registration.desktopDeviceId,
    desktopPublicKey: registration.desktopPublicKey,
    grantedScopes: registration.grantedScopes,
    registrationEnvelope: registration.envelope,
  };
}
