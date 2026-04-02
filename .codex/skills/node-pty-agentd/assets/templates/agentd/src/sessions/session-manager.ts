import type { SessionStatus } from "@pocketcoder/protocol";

import type { CodexProviderEvent } from "../providers/codex/codex-parser.js";
import { canTransitionSession } from "./state-machine.js";
import type { SessionRecord, SessionRegistry } from "./session-registry.js";

export interface SessionManager {
  openSession(sessionId: string, provider: string): SessionRecord;
  updateStatus(sessionId: string, nextStatus: SessionStatus): SessionRecord;
  recordProviderEvent(event: CodexProviderEvent): Promise<void>;
}

export function createSessionManager(registry: SessionRegistry): SessionManager {
  return {
    openSession(sessionId, provider) {
      const record: SessionRecord = {
        sessionId,
        provider,
        status: "idle",
        lastActivityAt: new Date().toISOString()
      };
      registry.set(record);
      return record;
    },
    updateStatus(sessionId, nextStatus) {
      const current = registry.get(sessionId);
      if (!current) {
        throw new Error(`unknown session: ${sessionId}`);
      }
      if (!canTransitionSession(current.status, nextStatus)) {
        throw new Error(`invalid transition: ${current.status} -> ${nextStatus}`);
      }
      const updated: SessionRecord = {
        ...current,
        status: nextStatus,
        lastActivityAt: new Date().toISOString()
      };
      registry.set(updated);
      return updated;
    },
    async recordProviderEvent(event) {
      const sessionId = String(event.payload.sessionId ?? "default-session");
      const record = registry.get(sessionId) ?? this.openSession(sessionId, "codex");
      registry.set({
        ...record,
        lastActivityAt: new Date().toISOString()
      });
    }
  };
}