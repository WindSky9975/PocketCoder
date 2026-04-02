export interface StoredPairedDevice {
  deviceId: string;
  pairedAt: string;
  relayOrigin: string;
  accessScope: string[];
}

export function createStoredPairedDevice(deviceId: string, relayOrigin: string): StoredPairedDevice {
  return {
    deviceId,
    pairedAt: new Date().toISOString(),
    relayOrigin,
    accessScope: ["session:read", "session:write"],
  };
}