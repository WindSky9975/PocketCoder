import {
  createInitialControlState,
  markDesktopControlRecovered,
  type DesktopControlSnapshot,
} from "./control-state.js";
import type { LocalInputSignal } from "./input-detector.js";

export interface DesktopControlRecoveryEvent {
  sessionId: string;
  source: "command" | "local-input";
  reason: "remote-control-revoked" | "local-recovery";
  recoveredAt: string;
}

export interface DesktopControlBoundary {
  getSnapshot(): DesktopControlSnapshot;
  canAcceptRemoteCommands(): boolean;
  markRemoteControlReleased(): DesktopControlRecoveryEvent | null;
  handleLocalInput(signal: LocalInputSignal): DesktopControlRecoveryEvent | null;
}

export function createDesktopControlBoundary(sessionId: string): DesktopControlBoundary {
  let snapshot = createInitialControlState(sessionId);

  return {
    getSnapshot() {
      return snapshot;
    },
    canAcceptRemoteCommands() {
      return snapshot.status === "remote-active";
    },
    markRemoteControlReleased() {
      if (snapshot.status !== "remote-active") {
        return null;
      }

      snapshot = markDesktopControlRecovered(snapshot, "command");
      return {
        sessionId,
        source: "command",
        reason: "remote-control-revoked",
        recoveredAt: snapshot.recoveredAt ?? new Date().toISOString(),
      };
    },
    handleLocalInput(signal) {
      if (signal.sessionId !== sessionId || snapshot.status !== "remote-active") {
        return null;
      }

      snapshot = markDesktopControlRecovered(snapshot, "local-input", signal.detectedAt);
      return {
        sessionId,
        source: "local-input",
        reason: "local-recovery",
        recoveredAt: snapshot.recoveredAt ?? signal.detectedAt,
      };
    },
  };
}
