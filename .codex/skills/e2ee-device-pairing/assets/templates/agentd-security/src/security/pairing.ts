export interface PairingTokenEnvelope {
  token: string;
  expiresAt: string;
  url: string;
}

export function issuePairingToken(deviceId: string): PairingTokenEnvelope {
  const token = `pair-${deviceId}-placeholder`;

  return {
    token,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    url: `pocketcoder://pair?token=${token}`,
  };
}