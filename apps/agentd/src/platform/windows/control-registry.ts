import { createDesktopControlBoundary, type DesktopControlRecoveryEvent } from "./desktop-control.js";
import type { DesktopControlSnapshot } from "./control-state.js";
import type { InputDetector, LocalInputSignal } from "./input-detector.js";

export interface DesktopControlRegistry {
  ensureSession(sessionId: string): DesktopControlSnapshot;
  getSnapshot(sessionId: string): DesktopControlSnapshot | null;
  canAcceptRemoteCommands(sessionId: string): boolean;
  markRemoteControlReleased(sessionId: string): DesktopControlRecoveryEvent | null;
  handleLocalInput(signal: LocalInputSignal): DesktopControlRecoveryEvent | null;
}

export function createDesktopControlRegistry(args: {
  detector?: InputDetector;
  onRecovered?: (event: DesktopControlRecoveryEvent) => void;
} = {}): DesktopControlRegistry {
  const boundaries = new Map<string, ReturnType<typeof createDesktopControlBoundary>>();
  const detector = args.detector;

  const createBoundary = (sessionId: string) => {
    const boundary = createDesktopControlBoundary(sessionId);
    boundaries.set(sessionId, boundary);
    return boundary;
  };

  const ensureBoundary = (sessionId: string) => {
    let boundary = boundaries.get(sessionId);
    if (!boundary) {
      boundary = createBoundary(sessionId);
      detector?.watchSession(sessionId);
    }

    return boundary;
  };

  const activateSessionBoundary = (sessionId: string) => {
    const existing = boundaries.get(sessionId);
    if (!existing) {
      const created = createBoundary(sessionId);
      detector?.watchSession(sessionId);
      return created;
    }

    if (existing.getSnapshot().status === "desktop-recovered") {
      const reset = createBoundary(sessionId);
      detector?.watchSession(sessionId);
      return reset;
    }

    detector?.watchSession(sessionId);
    return existing;
  };

  const publishRecovery = (event: DesktopControlRecoveryEvent | null) => {
    if (!event) {
      return null;
    }

    detector?.unwatchSession(event.sessionId);
    args.onRecovered?.(event);
    return event;
  };

  detector?.subscribe((signal) => {
    const boundary = boundaries.get(signal.sessionId);
    if (!boundary) {
      return;
    }

    publishRecovery(boundary.handleLocalInput(signal));
  });

  return {
    ensureSession(sessionId) {
      return activateSessionBoundary(sessionId).getSnapshot();
    },
    getSnapshot(sessionId) {
      return boundaries.get(sessionId)?.getSnapshot() ?? null;
    },
    canAcceptRemoteCommands(sessionId) {
      return ensureBoundary(sessionId).canAcceptRemoteCommands();
    },
    markRemoteControlReleased(sessionId) {
      return publishRecovery(ensureBoundary(sessionId).markRemoteControlReleased());
    },
    handleLocalInput(signal) {
      const boundary = boundaries.get(signal.sessionId);
      if (!boundary) {
        return null;
      }

      return publishRecovery(boundary.handleLocalInput(signal));
    },
  };
}
