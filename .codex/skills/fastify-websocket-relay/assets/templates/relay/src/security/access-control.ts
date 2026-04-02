export interface RelayConnectionContext {
  deviceId?: string;
}

export function assertRelayConnectionAllowed(context: RelayConnectionContext): void {
  if (!context.deviceId) {
    throw new Error("relay connection is missing device identity");
  }
}