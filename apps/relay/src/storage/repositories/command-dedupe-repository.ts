export interface CommandReceiptRecord {
  deviceId: string;
  messageId: string;
  recordedAt: string;
}

export interface CommandDedupeRepository {
  has(deviceId: string, messageId: string): boolean;
  save(record: CommandReceiptRecord): CommandReceiptRecord;
  list(): CommandReceiptRecord[];
}

export function createCommandDedupeRepository(
  store: Map<string, CommandReceiptRecord>,
): CommandDedupeRepository {
  return {
    has(deviceId, messageId) {
      return store.has(`${deviceId}:${messageId}`);
    },
    save(record) {
      store.set(`${record.deviceId}:${record.messageId}`, record);
      return record;
    },
    list() {
      return [...store.values()];
    },
  };
}
