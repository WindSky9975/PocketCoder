export type DesktopControlSource = "command" | "local-input";
export type DesktopControlStatus = "remote-active" | "desktop-recovered";

export interface DesktopControlSnapshot {
  sessionId: string;
  status: DesktopControlStatus;
  source: DesktopControlSource | null;
  recoveredAt: string | null;
}

export function createInitialControlState(sessionId: string): DesktopControlSnapshot {
  return {
    sessionId,
    status: "remote-active",
    source: null,
    recoveredAt: null,
  };
}

export function markDesktopControlRecovered(
  snapshot: DesktopControlSnapshot,
  source: DesktopControlSource,
): DesktopControlSnapshot {
  return {
    ...snapshot,
    status: "desktop-recovered",
    source,
    recoveredAt: new Date().toISOString(),
  };
}