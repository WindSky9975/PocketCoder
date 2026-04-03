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

  const ensureBoundary = (sessionId: string) => {
    let boundary = boundaries.get(sessionId);
    if (!boundary) {
      boundary = createDesktopControlBoundary(sessionId);
      boundaries.set(sessionId, boundary);
    }

    return boundary;
  };

  args.detector?.subscribe((signal) => {
    const boundary = boundaries.get(signal.sessionId);
    if (!boundary) {
      return;
    }

    const event = boundary.handleLocalInput(signal);
    if (event) {
      args.onRecovered?.(event);
    }
  });

  return {
    ensureSession(sessionId) {
      return ensureBoundary(sessionId).getSnapshot();
    },
    getSnapshot(sessionId) {
      return boundaries.get(sessionId)?.getSnapshot() ?? null;
    },
    canAcceptRemoteCommands(sessionId) {
      return ensureBoundary(sessionId).canAcceptRemoteCommands();
    },
    markRemoteControlReleased(sessionId) {
      const event = ensureBoundary(sessionId).markRemoteControlReleased();
      if (event) {
        args.onRecovered?.(event);
      }

      return event;
    },
    handleLocalInput(signal) {
      const event = ensureBoundary(signal.sessionId).handleLocalInput(signal);
      if (event) {
        args.onRecovered?.(event);
      }

      return event;
    },
  };
}
