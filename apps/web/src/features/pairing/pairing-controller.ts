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

export interface PairingStartPayload {
  pairingToken: string;
  deviceName: string;
  publicKey: string;
}

export interface PairingStartResult {
  pairedDevice: StoredPairedDevice;
  desktopDeviceId: string;
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
      input.relayOrigin,
      registration.grantedScopes,
    ),
    desktopDeviceId: registration.desktopDeviceId,
    grantedScopes: registration.grantedScopes,
    registrationEnvelope: registration.envelope,
  };
}
