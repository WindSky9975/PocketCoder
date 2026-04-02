import type { CodexPtyProcess } from "../providers/codex/codex-pty.js";
import type { SessionRecord } from "../sessions/session-registry.js";
import type { SessionManager } from "../sessions/session-manager.js";

export interface CommandEnvelope {
  type: string;
  payload: Record<string, unknown>;
}

export interface CommandHandler {
  handle(command: CommandEnvelope): Promise<SessionRecord | null>;
}

export function createCommandHandler(
  sessionManager: SessionManager,
  codexPty: CodexPtyProcess,
): CommandHandler {
  return {
    async handle(command) {
      if (command.type === "SendPrompt") {
        await codexPty.write(String(command.payload.prompt ?? ""));
        return sessionManager.updateStatus(String(command.payload.sessionId), "running");
      }

      if (command.type === "ApprovalResponse") {
        return sessionManager.updateStatus(String(command.payload.sessionId), "running");
      }

      if (command.type === "InterruptSession") {
        await codexPty.stop();
        return sessionManager.updateStatus(String(command.payload.sessionId), "disconnected");
      }

      if (command.type === "ResumeDesktopControl") {
        return sessionManager.updateStatus(String(command.payload.sessionId), "disconnected");
      }

      return null;
    }
  };
}
