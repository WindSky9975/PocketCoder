import type { SessionStatus } from "@pocketcoder/protocol";

export interface SessionRecord {
  sessionId: string;
  provider: string;
  status: SessionStatus;
  currentTask?: string;
  lastActivityAt: string;
}

export interface SessionRegistry {
  get(sessionId: string): SessionRecord | undefined;
  set(record: SessionRecord): void;
  list(): SessionRecord[];
}

export function createSessionRegistry(): SessionRegistry {
  const records = new Map<string, SessionRecord>();

  return {
    get(sessionId) {
      return records.get(sessionId);
    },
    set(record) {
      records.set(record.sessionId, record);
    },
    list() {
      return [...records.values()];
    }
  };
}