import type { SessionManager } from "../../sessions/session-manager.js";
import type { AgentdEventPublisher } from "../../transport/event-publisher.js";
import type { CodexProviderEvent } from "./codex-parser.js";

export interface CodexSessionAdapter {
  apply(event: CodexProviderEvent): Promise<void>;
}

export function createCodexSessionAdapter(
  sessionManager: SessionManager,
  eventPublisher: AgentdEventPublisher
): CodexSessionAdapter {
  return {
    async apply(event) {
      const record = await sessionManager.recordProviderEvent(event);

      if (
        event.type === "session.started" ||
        event.type === "session.state.changed" ||
        event.type === "session.ended"
      ) {
        await eventPublisher.publishSessionSummary(record);
      }

      await eventPublisher.publishProviderEvent(event, record);
    }
  };
}
