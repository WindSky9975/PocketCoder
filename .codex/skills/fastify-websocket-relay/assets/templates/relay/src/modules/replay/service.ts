import type { ProtocolEventEnvelope } from "@pocketcoder/protocol";

import type { ReplayEventRepository } from "../../storage/repositories/replay-event-repository.js";

export interface ReplayService {
  record(envelope: ProtocolEventEnvelope): void;
  listRecent(sessionId: string, nowIso?: string): ProtocolEventEnvelope[];
}

export function createReplayService(
  repository: ReplayEventRepository,
  replayWindowMs: number,
): ReplayService {
  return {
    record(envelope) {
      const payload = envelope.payload as { sessionId?: unknown };
      const sessionId = payload.sessionId;
      if (typeof sessionId !== "string" || sessionId.length === 0) {
        return;
      }

      repository.append({
        sessionId,
        messageId: envelope.messageId,
        ciphertextBlob: JSON.stringify(envelope),
        recordedAt: envelope.timestamp,
      });
    },
    listRecent(sessionId, nowIso = new Date().toISOString()) {
      const sinceIso = new Date(Date.parse(nowIso) - replayWindowMs).toISOString();
      return repository
        .listBySessionSince(sessionId, sinceIso)
        .map((record) => JSON.parse(record.ciphertextBlob) as ProtocolEventEnvelope);
    },
  };
}
