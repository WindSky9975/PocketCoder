import type { CodexPtyProcess } from "../providers/codex/codex-pty.js";
import type { DesktopControlRegistry } from "../platform/windows/control-registry.js";
import type { SessionRecord } from "../sessions/session-registry.js";
import type { SessionManager } from "../sessions/session-manager.js";

export interface CommandEnvelope {
  type: string;
  payload: Record<string, unknown>;
}

export interface CommandHandleResult {
  updatedSession: SessionRecord | null;
  stateChangeReason?: string;
  rejectedReason?: string;
}

export interface CommandHandler {
  handle(command: CommandEnvelope): Promise<CommandHandleResult>;
}

export function createCommandHandler(
  sessionManager: SessionManager,
  codexPty: CodexPtyProcess,
  desktopControl?: DesktopControlRegistry,
): CommandHandler {
  function readSessionId(command: CommandEnvelope): string {
    return String(command.payload.sessionId ?? "");
  }

  function disconnectSession(sessionId: string): SessionRecord {
    const existing = sessionManager.getSession(sessionId);
    if (!existing) {
      throw new Error(`unknown session: ${sessionId}`);
    }

    return existing.status === "disconnected"
      ? existing
      : sessionManager.updateStatus(sessionId, "disconnected");
  }

  function rejectIfRemoteControlRevoked(command: CommandEnvelope): CommandHandleResult | null {
    const sessionId = readSessionId(command);
    if (!sessionId || !desktopControl || desktopControl.canAcceptRemoteCommands(sessionId)) {
      return null;
    }

    return {
      updatedSession: null,
      rejectedReason: "remote-control-revoked",
    };
  }

  return {
    async handle(command) {
      if (
        command.type === "SendPrompt" ||
        command.type === "ApprovalResponse" ||
        command.type === "InterruptSession"
      ) {
        const blocked = rejectIfRemoteControlRevoked(command);
        if (blocked) {
          return blocked;
        }
      }

      if (command.type === "SendPrompt") {
        await codexPty.write(String(command.payload.prompt ?? ""));
        return {
          updatedSession: sessionManager.updateStatus(readSessionId(command), "running"),
        };
      }

      if (command.type === "ApprovalResponse") {
        return {
          updatedSession: sessionManager.updateStatus(readSessionId(command), "running"),
        };
      }

      if (command.type === "InterruptSession") {
        await codexPty.stop();
        return {
          updatedSession: disconnectSession(readSessionId(command)),
        };
      }

      if (command.type === "ResumeDesktopControl") {
        const sessionId = readSessionId(command);
        const recovery = desktopControl?.markRemoteControlReleased(sessionId);

        return {
          updatedSession: disconnectSession(sessionId),
          ...(recovery ? { stateChangeReason: recovery.reason } : {}),
        };
      }

      return {
        updatedSession: null,
      };
    }
  };
}
