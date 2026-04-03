import type { SessionStatus } from "@pocketcoder/protocol";

export interface SessionRouteRecord {
  sessionId: string;
  ownerDeviceId: string;
  provider?: string;
  status?: SessionStatus;
  lastStateReason?: string;
  currentTask?: string;
  lastActivityAt?: string;
  updatedAt: string;
}

export interface SessionRouteRepository {
  get(sessionId: string): SessionRouteRecord | null;
  save(record: SessionRouteRecord): SessionRouteRecord;
  list(): SessionRouteRecord[];
}

export function createSessionRouteRepository(
  store: Map<string, SessionRouteRecord>,
): SessionRouteRepository {
  return {
    get(sessionId) {
      return store.get(sessionId) ?? null;
    },
    save(record) {
      store.set(record.sessionId, record);
      return record;
    },
    list() {
      return [...store.values()];
    },
  };
}
