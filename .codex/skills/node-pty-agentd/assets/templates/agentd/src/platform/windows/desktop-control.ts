export interface DesktopControlBoundary {
  markRemoteControlReleased(sessionId: string): Promise<void>;
}

export function createDesktopControlBoundary(): DesktopControlBoundary {
  return {
    async markRemoteControlReleased(sessionId) {
      console.log("[agentd] desktop control released", { sessionId });
    }
  };
}