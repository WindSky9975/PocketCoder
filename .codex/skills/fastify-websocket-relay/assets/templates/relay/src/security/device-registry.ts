export interface RegisteredDevice {
  deviceId: string;
  label: string;
  registeredAt: string;
}

export function createRegisteredDevice(deviceId: string, label: string): RegisteredDevice {
  return {
    deviceId,
    label,
    registeredAt: new Date().toISOString()
  };
}