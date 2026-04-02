export interface BrowserDeviceKeyRecord {
  deviceId: string;
  publicKey: string;
  privateKeyRef: string;
  pairedAt: string | null;
}

export function createBrowserDeviceKeyRecord(deviceId: string): BrowserDeviceKeyRecord {
  return {
    deviceId,
    publicKey: "placeholder-browser-public-key",
    privateKeyRef: `browser-secure-store://paired-device/${deviceId}`,
    pairedAt: null,
  };
}