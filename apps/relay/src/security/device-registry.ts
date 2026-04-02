import { createHash } from "node:crypto";

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
  ensureDesktopDevice(deviceId: string): RegisteredDevice;
  registerBrowserDevice(input: {
    desktopDeviceId: string;
    deviceName: string;
    publicKey: string;
    pairedAt: string;
    scopes?: string[];
  }): RegisteredDevice;
  getRegisteredDevice(deviceId: string): RegisteredDevice | null;
  getGrant(deviceId: string): DeviceGrant | null;
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
    ensureDesktopDevice(deviceId) {
      const existing = repository.get(deviceId);
      if (existing) {
        return existing;
      }

      const created = createRegisteredDevice({
        deviceId,
        deviceName: "Desktop Agent",
        publicKey: "desktop-public-key-pending",
        role: "desktop",
        pairedDesktopDeviceId: null,
        pairedAt: new Date().toISOString(),
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
  };
}
