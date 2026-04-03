import type { ProtocolEventEnvelope } from "@pocketcoder/protocol";

import type { ReplayEventRepository } from "../../storage/repositories/replay-event-repository.js";

export interface ReplayService {
  record(envelope: ProtocolEventEnvelope): void;
  listRecent(sessionId: string, recipientDeviceId: string, nowIso?: string): ProtocolEventEnvelope[];
}

export function createReplayService(
  repository: ReplayEventRepository,
  replayWindowMs: number,
): ReplayService {
  return {
    record(envelope) {
      const payload = envelope.payload as {
        sessionId?: unknown;
        encrypted?: {
          recipientDeviceId?: unknown;
        };
      };
      const sessionId = payload.sessionId;
      if (typeof sessionId !== "string" || sessionId.length === 0) {
        return;
      }
      if (typeof payload.encrypted?.recipientDeviceId !== "string") {
        return;
      }

      repository.append({
        sessionId,
        recipientDeviceId: payload.encrypted.recipientDeviceId,
        messageId: envelope.messageId,
        ciphertextBlob: JSON.stringify(envelope),
        recordedAt: envelope.timestamp,
      });
    },
    listRecent(sessionId, recipientDeviceId, nowIso = new Date().toISOString()) {
      const sinceIso = new Date(Date.parse(nowIso) - replayWindowMs).toISOString();
      return repository
        .listBySessionRecipientSince(sessionId, recipientDeviceId, sinceIso)
        .map((record) => JSON.parse(record.ciphertextBlob) as ProtocolEventEnvelope);
    },
  };
}
