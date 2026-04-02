export interface RelayStorage {
  ping(): Promise<{ ok: true }>;
}

export function createRelayStorage(): RelayStorage {
  return {
    async ping() {
      return { ok: true };
    }
  };
}