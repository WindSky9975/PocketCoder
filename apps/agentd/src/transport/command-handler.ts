import type { EncryptedPayload } from "@pocketcoder/protocol";

import type { CodexPtyProcess } from "../providers/codex/codex-pty.js";
import type { DesktopControlRegistry } from "../platform/windows/control-registry.js";
import { createPairedBrowserRegistry } from "../security/paired-browser-registry.js";
import { decryptAgentdPayload } from "../security/session-crypto.js";
import type { PairedBrowserRegistry } from "../security/paired-browser-registry.js";
import type { SessionRecord } from "../sessions/session-registry.js";
import type { SessionManager } from "../sessions/session-manager.js";

export interface CommandEnvelope {
  type: string;
  messageId: string;
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
  runtimeRootOrDesktopControl?: string | DesktopControlRegistry,
  pairedBrowsersOrDesktopControl?: PairedBrowserRegistry | DesktopControlRegistry,
  desktopControlArg?: DesktopControlRegistry,
): CommandHandler {
  const runtimeRoot =
    typeof runtimeRootOrDesktopControl === "string" ? runtimeRootOrDesktopControl : "";
  const pairedBrowsers =
    typeof runtimeRootOrDesktopControl === "string"
      ? ((pairedBrowsersOrDesktopControl as PairedBrowserRegistry | undefined) ??
        createPairedBrowserRegistry())
      : createPairedBrowserRegistry();
  const desktopControl =
    typeof runtimeRootOrDesktopControl === "string"
      ? desktopControlArg
      : (runtimeRootOrDesktopControl as DesktopControlRegistry | undefined);

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

  function decryptCommand<T>(command: CommandEnvelope): T | null {
    const encrypted =
      typeof command.payload.encrypted === "object" && command.payload.encrypted !== null
        ? command.payload.encrypted
        : null;
    if (!encrypted) {
      return null;
    }

    const senderDeviceId =
      "senderDeviceId" in encrypted && typeof encrypted.senderDeviceId === "string"
        ? encrypted.senderDeviceId
        : "";
    const browser = pairedBrowsers.get(senderDeviceId);
    if (!browser) {
      throw new Error(`missing paired browser public key for ${senderDeviceId}`);
    }

    return decryptAgentdPayload<T>({
      runtimeRoot,
      remotePublicKey: browser.publicKey,
      type: command.type,
      messageId: command.messageId,
      sessionId: readSessionId(command),
      encrypted: encrypted as EncryptedPayload,
    });
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
        const decrypted = decryptCommand<{ prompt?: string }>(command);
        await codexPty.write(String(decrypted?.prompt ?? command.payload.prompt ?? ""));
        return {
          updatedSession: sessionManager.updateStatus(readSessionId(command), "running"),
        };
      }

      if (command.type === "ApprovalResponse") {
        decryptCommand<{ approvalId?: string; decision?: "allow" | "deny" }>(command);
        return {
          updatedSession: sessionManager.updateStatus(readSessionId(command), "running"),
        };
      }

      if (command.type === "InterruptSession") {
        decryptCommand<{ reason?: string }>(command);
        await codexPty.stop();
        return {
          updatedSession: disconnectSession(readSessionId(command)),
        };
      }

      if (command.type === "ResumeDesktopControl") {
        decryptCommand<{ requestedBy?: string }>(command);
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
