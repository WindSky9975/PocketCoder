import {
  createInitialControlState,
  markDesktopControlRecovered,
  type DesktopControlSnapshot,
} from "./control-state";
import type { InputDetector, LocalInputSignal } from "./input-detector";

export interface DesktopControlBoundary {
  getSnapshot(): DesktopControlSnapshot;
  markRemoteControlReleased(): DesktopControlSnapshot;
  handleLocalInput(signal: LocalInputSignal): DesktopControlSnapshot;
}

export function createDesktopControlBoundary(
  sessionId: string,
  detector?: InputDetector,
): DesktopControlBoundary {
  let snapshot = createInitialControlState(sessionId);

  detector?.subscribe((signal) => {
    if (signal.sessionId === sessionId) {
      snapshot = markDesktopControlRecovered(snapshot, "local-input");
    }
  });

  return {
    getSnapshot() {
      return snapshot;
    },
    markRemoteControlReleased() {
      snapshot = markDesktopControlRecovered(snapshot, "command");
      return snapshot;
    },
    handleLocalInput(signal) {
      if (signal.sessionId === sessionId) {
        snapshot = markDesktopControlRecovered(snapshot, "local-input");
      }
      return snapshot;
    },
  };
}