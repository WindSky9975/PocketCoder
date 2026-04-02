export interface DeviceKeyRecord {
  deviceId: string;
  publicKey: string;
  privateKeyRef: string;
  createdAt: string;
}

export function createDeviceKeyRecord(deviceId: string): DeviceKeyRecord {
  return {
    deviceId,
    publicKey: "placeholder-public-key",
    privateKeyRef: `local-secure-store://agentd/${deviceId}`,
    createdAt: new Date().toISOString(),
  };
}