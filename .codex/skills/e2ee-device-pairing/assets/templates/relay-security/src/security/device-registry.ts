export interface RegisteredDevice {
  deviceId: string;
  publicKey: string;
  pairedAt: string;
  revokedAt: string | null;
}

export function createRegisteredDevice(deviceId: string, publicKey: string): RegisteredDevice {
  return {
    deviceId,
    publicKey,
    pairedAt: new Date().toISOString(),
    revokedAt: null,
  };
}