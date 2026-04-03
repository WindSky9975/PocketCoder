export interface PairedBrowserRecord {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  pairedDesktopDeviceId: string;
  grantedScopes: string[];
  registeredAt: string;
}

export interface PairedBrowserRegistry {
  upsert(record: PairedBrowserRecord): void;
  get(deviceId: string): PairedBrowserRecord | null;
  list(): PairedBrowserRecord[];
  listForDesktop(desktopDeviceId: string): PairedBrowserRecord[];
}

export function createPairedBrowserRegistry(): PairedBrowserRegistry {
  const records = new Map<string, PairedBrowserRecord>();

  return {
    upsert(record) {
      records.set(record.deviceId, record);
    },
    get(deviceId) {
      return records.get(deviceId) ?? null;
    },
    list() {
      return [...records.values()];
    },
    listForDesktop(desktopDeviceId) {
      return [...records.values()].filter(
        (record) => record.pairedDesktopDeviceId === desktopDeviceId,
      );
    },
  };
}
