import type { SessionManager } from "../sessions/session-manager.js";
import type { CodexPtyProcess } from "../providers/codex/codex-pty.js";

export interface CommandEnvelope {
  type: string;
  payload: Record<string, unknown>;
}

export interface CommandHandler {
  handle(command: CommandEnvelope): Promise<void>;
}

export function createCommandHandler(
  sessionManager: SessionManager,
  codexPty: CodexPtyProcess,
): CommandHandler {
  return {
    async handle(command) {
      if (command.type === "SendPrompt") {
        await codexPty.write(String(command.payload.prompt ?? ""));
        sessionManager.updateStatus(String(command.payload.sessionId), "running");
        return;
      }

      if (command.type === "ApprovalResponse") {
        sessionManager.updateStatus(String(command.payload.sessionId), "running");
        return;
      }

      if (command.type === "InterruptSession") {
        await codexPty.stop();
        sessionManager.updateStatus(String(command.payload.sessionId), "disconnected");
        return;
      }

      if (command.type === "ResumeDesktopControl") {
        sessionManager.updateStatus(String(command.payload.sessionId), "disconnected");
      }
    }
  };
}
