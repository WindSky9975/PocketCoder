import {
  PROTOCOL_VERSION,
  createMessageId,
  deviceRegisteredEnvelopeSchema,
  type PairingInitPayload,
} from "@pocketcoder/protocol";

import { createBrowserDeviceId, type DeviceRegistry } from "../../security/device-registry.js";
import { consumePairingToken, inspectPairingToken } from "../../security/token-service.js";
import type { PairingRecordRepository } from "../../storage/repositories/pairing-record-repository.js";

export interface PairingExchangeRequest {
  token: string;
  deviceName: string;
  candidatePublicKey: string;
}

export interface PairingRegistrationResult {
  relayOrigin: string;
  desktopDeviceId: string;
  desktopPublicKey: string;
  grantedScopes: string[];
  envelope: ReturnType<typeof deviceRegisteredEnvelopeSchema.parse>;
}

export interface PairingModule {
  inspectToken(token: string): ReturnType<typeof inspectPairingToken>;
  startPairing(payload: PairingInitPayload): PairingRegistrationResult;
}

export function normalizePairingExchange(request: PairingExchangeRequest): PairingExchangeRequest {
  return {
    token: request.token.trim(),
    deviceName: request.deviceName.trim(),
    candidatePublicKey: request.candidatePublicKey.trim(),
  };
}

export function createPairingModule(args: {
  pairingRecords: PairingRecordRepository;
  deviceRegistry: DeviceRegistry;
  relayOrigin: string;
}): PairingModule {
  return {
    inspectToken(token) {
      return inspectPairingToken(args.pairingRecords, token.trim());
    },
    startPairing(payload) {
      const normalized = normalizePairingExchange({
        token: payload.pairingToken,
        deviceName: payload.deviceName,
        candidatePublicKey: payload.publicKey,
      });

      const nowIso = new Date().toISOString();
      const inspection = inspectPairingToken(args.pairingRecords, normalized.token, nowIso);
      const desktopDeviceId = inspection.desktopDeviceId ?? "desktop-device";
      const desktopPublicKey = inspection.desktopPublicKey ?? "";
      const candidateDeviceId = createBrowserDeviceId(normalized.candidatePublicKey);

      const pairingRecord = consumePairingToken(args.pairingRecords, {
        token: normalized.token,
        candidateDeviceId,
        candidateDeviceName: normalized.deviceName,
        candidatePublicKey: normalized.candidatePublicKey,
        nowIso,
      });

      const browserDevice = args.deviceRegistry.registerBrowserDevice({
        desktopDeviceId,
        deviceName: normalized.deviceName,
        publicKey: normalized.candidatePublicKey,
        pairedAt: nowIso,
      });

      args.deviceRegistry.ensureDesktopDevice({
        deviceId: pairingRecord.desktopDeviceId,
        publicKey: pairingRecord.desktopPublicKey,
        pairedAt: nowIso,
      });

      return {
        relayOrigin: args.relayOrigin,
        desktopDeviceId: pairingRecord.desktopDeviceId,
        desktopPublicKey,
        grantedScopes: browserDevice.scopes,
        envelope: deviceRegisteredEnvelopeSchema.parse({
          protocolVersion: PROTOCOL_VERSION,
          messageId: createMessageId("pair"),
          timestamp: nowIso,
          type: "DeviceRegistered",
          payload: {
            deviceId: browserDevice.deviceId,
            deviceName: browserDevice.deviceName,
            registeredAt: browserDevice.pairedAt,
          },
        }),
      };
    },
  };
}
