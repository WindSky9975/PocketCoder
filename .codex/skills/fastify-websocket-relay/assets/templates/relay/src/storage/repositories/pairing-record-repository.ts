export interface PairingRecord {
  tokenHash: string;
  desktopDeviceId: string;
  candidatePublicKey: string | null;
  candidateDeviceName: string | null;
  candidateDeviceId: string | null;
  ciphertextBlob: string | null;
  expiresAt: string;
  usedAt: string | null;
}

export interface PairingRecordRepository {
  get(tokenHash: string): PairingRecord | null;
  save(record: PairingRecord): PairingRecord;
  list(): PairingRecord[];
}

export function createPairingRecordRepository(
  store: Map<string, PairingRecord>,
): PairingRecordRepository {
  return {
    get(tokenHash) {
      return store.get(tokenHash) ?? null;
    },
    save(record) {
      store.set(record.tokenHash, record);
      return record;
    },
    list() {
      return [...store.values()];
    },
  };
}

export function createEmptyPairingRecord(
  tokenHash: string,
  desktopDeviceId: string,
  expiresAt: string,
): PairingRecord {
  return {
    tokenHash,
    desktopDeviceId,
    candidatePublicKey: null,
    candidateDeviceName: null,
    candidateDeviceId: null,
    ciphertextBlob: null,
    expiresAt,
    usedAt: null,
  };
}
