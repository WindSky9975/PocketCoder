export interface ReplayEventRecord {
  sessionId: string;
  messageId: string;
  ciphertextBlob: string;
  recordedAt: string;
}

export interface ReplayEventRepository {
  append(record: ReplayEventRecord): ReplayEventRecord;
  listBySessionSince(sessionId: string, sinceIso: string): ReplayEventRecord[];
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
    listBySessionSince(sessionId, sinceIso) {
      const sinceMs = Date.parse(sinceIso);
      return store.filter((record) => {
        return record.sessionId === sessionId && Date.parse(record.recordedAt) >= sinceMs;
      });
    },
    list() {
      return [...store];
    },
  };
}
