export type RelayDeviceRole = "desktop" | "browser";

export interface DeviceRecord {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  role: RelayDeviceRole;
  pairedDesktopDeviceId: string | null;
  pairedAt: string;
  revokedAt: string | null;
  scopes: string[];
}

export interface DeviceRecordRepository {
  get(deviceId: string): DeviceRecord | null;
  save(record: DeviceRecord): DeviceRecord;
  list(): DeviceRecord[];
}

export function createDeviceRecordRepository(
  store: Map<string, DeviceRecord>,
): DeviceRecordRepository {
  return {
    get(deviceId) {
      return store.get(deviceId) ?? null;
    },
    save(record) {
      store.set(record.deviceId, record);
      return record;
    },
    list() {
      return [...store.values()];
    },
  };
}
