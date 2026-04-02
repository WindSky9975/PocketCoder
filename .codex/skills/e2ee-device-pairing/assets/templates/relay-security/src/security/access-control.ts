export interface DeviceGrant {
  deviceId: string;
  scopes: string[];
  revokedAt: string | null;
}

export function canAccessSession(grant: DeviceGrant | null, scope = "session:read"): boolean {
  return grant !== null && grant.revokedAt === null && grant.scopes.includes(scope);
}