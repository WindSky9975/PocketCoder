import type { SessionStatus } from "@pocketcoder/protocol";

import type { CodexProviderEvent } from "../providers/codex/codex-parser.js";
import { canTransitionSession } from "./state-machine.js";
import type { SessionRecord, SessionRegistry } from "./session-registry.js";

export interface SessionManager {
  openSession(sessionId: string, provider: string): SessionRecord;
  getSession(sessionId: string): SessionRecord | undefined;
  listSessions(): SessionRecord[];
  updateStatus(sessionId: string, nextStatus: SessionStatus): SessionRecord;
  recordProviderEvent(event: CodexProviderEvent): Promise<SessionRecord>;
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
    getSession(sessionId) {
      return registry.get(sessionId);
    },
    listSessions() {
      return registry.list();
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
      const existing = registry.get(sessionId) ?? this.openSession(sessionId, "codex");
      const nextStatus = resolveNextStatus(event, existing.status);
      const record: SessionRecord = {
        ...existing,
        status: nextStatus,
        currentTask:
          typeof event.payload.currentTask === "string"
            ? event.payload.currentTask
            : existing.currentTask,
        lastActivityAt: new Date().toISOString()
      };
      registry.set(record);
      return record;
    }
  };
}

function resolveNextStatus(
  event: CodexProviderEvent,
  currentStatus: SessionStatus,
): SessionStatus {
  if (
    event.type === "session.state.changed" &&
    typeof event.payload.status === "string"
  ) {
    return event.payload.status as SessionStatus;
  }

  if (event.type === "session.started" || event.type === "session.output.delta") {
    return "running";
  }

  if (event.type === "session.approval.requested") {
    return "waiting_approval";
  }

  if (event.type === "session.error") {
    return "error";
  }

  if (event.type === "session.ended") {
    return "disconnected";
  }

  return currentStatus;
}
