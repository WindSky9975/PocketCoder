export interface PairingRecord {
  tokenHash: string;
  desktopDeviceId: string;
  candidateDeviceId: string | null;
  ciphertextBlob: string | null;
  expiresAt: string;
}

export function createEmptyPairingRecord(
  tokenHash: string,
  desktopDeviceId: string,
  expiresAt: string,
): PairingRecord {
  return {
    tokenHash,
    desktopDeviceId,
    candidateDeviceId: null,
    ciphertextBlob: null,
    expiresAt,
  };
}