import { RelayProtocolError } from "../infra/protocol-error.js";
import type { DeviceGrant } from "./device-registry.js";
import type { RelayDeviceRole } from "../storage/repositories/device-record-repository.js";

export interface RelayConnectionContext {
  deviceId?: string;
  role: RelayDeviceRole;
  grant: DeviceGrant | null;
}

export function assertRelayConnectionAllowed(context: RelayConnectionContext): void {
  if (!context.deviceId) {
    throw new RelayProtocolError({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "relay connection is missing device identity",
    });
  }

  if (context.role === "desktop") {
    return;
  }

  if (context.grant === null || context.grant.revokedAt !== null) {
    throw new RelayProtocolError({
      code: "UNAUTHORIZED",
      statusCode: 403,
      message: "device is not registered for relay access",
      details: { deviceId: context.deviceId },
    });
  }
}

export function canAccessSession(grant: DeviceGrant | null, scope = "session:read"): boolean {
  return grant !== null && grant.revokedAt === null && grant.scopes.includes(scope);
}

export function assertSessionScope(grant: DeviceGrant | null, scope: string): void {
  if (!canAccessSession(grant, scope)) {
    throw new RelayProtocolError({
      code: "UNAUTHORIZED",
      statusCode: 403,
      message: `device is missing required scope: ${scope}`,
      details: { scope },
    });
  }
}
