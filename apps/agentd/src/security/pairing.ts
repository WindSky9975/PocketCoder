import { randomUUID } from "node:crypto";

export interface PairingTokenEnvelope {
  token: string;
  expiresAt: string;
  url: string;
}

function createPairingToken(deviceId: string, expiresAt: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      desktopDeviceId: deviceId,
      expiresAt,
      nonce: randomUUID(),
    }),
    "utf8",
  ).toString("base64url");

  return `pair.v1.${payload}`;
}

export function issuePairingToken(deviceId: string): PairingTokenEnvelope {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const token = createPairingToken(deviceId, expiresAt);

  return {
    token,
    expiresAt,
    url: `pocketcoder://pair?token=${encodeURIComponent(token)}`,
  };
}
