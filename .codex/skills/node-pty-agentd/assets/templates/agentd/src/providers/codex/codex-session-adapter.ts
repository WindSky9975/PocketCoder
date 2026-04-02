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
      await sessionManager.recordProviderEvent(event);
      await eventPublisher.publish(event);
    }
  };
}