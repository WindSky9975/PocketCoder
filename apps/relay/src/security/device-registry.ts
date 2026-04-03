import { createHash } from "node:crypto";

import { RelayProtocolError } from "../infra/protocol-error.js";
import type {
  DeviceRecord,
  DeviceRecordRepository,
  RelayDeviceRole,
} from "../storage/repositories/device-record-repository.js";

export interface DeviceGrant {
  deviceId: string;
  scopes: string[];
  revokedAt: string | null;
}

export type RegisteredDevice = DeviceRecord;

export interface DeviceRegistry {
  ensureDesktopDevice(input: {
    deviceId: string;
    publicKey: string;
    pairedAt?: string;
  }): RegisteredDevice;
  registerBrowserDevice(input: {
    desktopDeviceId: string;
    deviceName: string;
    publicKey: string;
    pairedAt: string;
    scopes?: string[];
  }): RegisteredDevice;
  getRegisteredDevice(deviceId: string): RegisteredDevice | null;
  getGrant(deviceId: string): DeviceGrant | null;
  listPairedBrowserDevices(desktopDeviceId: string): RegisteredDevice[];
}

export function createRegisteredDevice(args: {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  role: RelayDeviceRole;
  pairedDesktopDeviceId: string | null;
  pairedAt: string;
  scopes: string[];
}): RegisteredDevice {
  return {
    deviceId: args.deviceId,
    deviceName: args.deviceName,
    publicKey: args.publicKey,
    role: args.role,
    pairedDesktopDeviceId: args.pairedDesktopDeviceId,
    pairedAt: args.pairedAt,
    revokedAt: null,
    scopes: args.scopes,
  };
}

export function createBrowserDeviceId(publicKey: string): string {
  const fingerprint = createHash("sha256").update(publicKey).digest("hex").slice(0, 12);
  return `browser-${fingerprint}`;
}

export function createDeviceRegistry(repository: DeviceRecordRepository): DeviceRegistry {
  return {
    ensureDesktopDevice(input) {
      const existing = repository.get(input.deviceId);
      if (existing) {
        if (existing.role !== "desktop") {
          throw new RelayProtocolError({
            code: "UNAUTHORIZED",
            statusCode: 403,
            message: "device identity is already bound to a non-desktop role",
            details: { deviceId: input.deviceId, role: existing.role },
          });
        }

        if (existing.publicKey !== input.publicKey) {
          throw new RelayProtocolError({
            code: "UNAUTHORIZED",
            statusCode: 403,
            message: "desktop device public key does not match the registered identity",
            details: { deviceId: input.deviceId },
          });
        }

        return existing;
      }

      const created = createRegisteredDevice({
        deviceId: input.deviceId,
        deviceName: "Desktop Agent",
        publicKey: input.publicKey,
        role: "desktop",
        pairedDesktopDeviceId: null,
        pairedAt: input.pairedAt ?? new Date().toISOString(),
        scopes: ["session:publish"],
      });

      return repository.save(created);
    },
    registerBrowserDevice(input) {
      const deviceId = createBrowserDeviceId(input.publicKey);
      const existing = repository.get(deviceId);
      if (existing) {
        return existing;
      }

      const created = createRegisteredDevice({
        deviceId,
        deviceName: input.deviceName,
        publicKey: input.publicKey,
        role: "browser",
        pairedDesktopDeviceId: input.desktopDeviceId,
        pairedAt: input.pairedAt,
        scopes: input.scopes ?? ["session:read", "session:write"],
      });

      return repository.save(created);
    },
    getRegisteredDevice(deviceId) {
      return repository.get(deviceId);
    },
    getGrant(deviceId) {
      const device = repository.get(deviceId);
      if (!device) {
        return null;
      }

      return {
        deviceId: device.deviceId,
        scopes: device.scopes,
        revokedAt: device.revokedAt,
      };
    },
    listPairedBrowserDevices(desktopDeviceId) {
      return repository
        .list()
        .filter(
          (device) =>
            device.role === "browser" && device.pairedDesktopDeviceId === desktopDeviceId,
        );
    },
  };
}
