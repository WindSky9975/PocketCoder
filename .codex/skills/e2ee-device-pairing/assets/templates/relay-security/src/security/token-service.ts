export interface PairingTokenRecord {
  tokenHash: string;
  desktopDeviceId: string;
  expiresAt: string;
  usedAt: string | null;
}

export function canConsumePairingToken(record: PairingTokenRecord, nowIso: string): boolean {
  return record.usedAt === null && nowIso < record.expiresAt;
}