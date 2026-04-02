export interface DeviceKeyRecord {
  deviceId: string;
  publicKey: string;
}

export function createDeviceKeyPlaceholder(deviceId: string): DeviceKeyRecord {
  return {
    deviceId,
    publicKey: "placeholder-public-key"
  };
}