import type { SessionManager } from "../sessions/session-manager.js";

export interface CommandEnvelope {
  type: string;
  payload: Record<string, unknown>;
}

export interface CommandHandler {
  handle(command: CommandEnvelope): Promise<void>;
}

export function createCommandHandler(sessionManager: SessionManager): CommandHandler {
  return {
    async handle(command) {
      if (command.type === "ResumeDesktopControl") {
        sessionManager.updateStatus(String(command.payload.sessionId), "disconnected");
      }
    }
  };
}