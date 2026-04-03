export interface ReplayEventRecord {
  sessionId: string;
  recipientDeviceId: string;
  messageId: string;
  ciphertextBlob: string;
  recordedAt: string;
}

export interface ReplayEventRepository {
  append(record: ReplayEventRecord): ReplayEventRecord;
  listBySessionRecipientSince(
    sessionId: string,
    recipientDeviceId: string,
    sinceIso: string,
  ): ReplayEventRecord[];
  list(): ReplayEventRecord[];
}

export function createReplayEventRepository(
  store: ReplayEventRecord[],
): ReplayEventRepository {
  return {
    append(record) {
      store.push(record);
      return record;
    },
    listBySessionRecipientSince(sessionId, recipientDeviceId, sinceIso) {
      const sinceMs = Date.parse(sinceIso);
      return store.filter((record) => {
        return (
          record.sessionId === sessionId &&
          record.recipientDeviceId === recipientDeviceId &&
          Date.parse(record.recordedAt) >= sinceMs
        );
      });
    },
    list() {
      return [...store];
    },
  };
}
