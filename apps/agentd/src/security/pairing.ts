import { randomUUID } from "node:crypto";

import type { DeviceKeyRecord } from "./device-keys.js";
import { signPayloadWithDeviceKey } from "./device-keys.js";

export interface PairingTokenEnvelope {
  token: string;
  expiresAt: string;
  url: string;
}

interface PairingTokenClaims {
  desktopDeviceId: string;
  desktopPublicKey: string;
  expiresAt: string;
  tokenId: string;
}

function encodePairingToken(claims: PairingTokenClaims, signature: string): string {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  return `pair.v1.${payload}.${signature}`;
}

export function issuePairingToken(args: {
  runtimeRoot: string;
  deviceKey: DeviceKeyRecord;
  webOrigin?: string;
}): PairingTokenEnvelope {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const claims: PairingTokenClaims = {
    desktopDeviceId: args.deviceKey.deviceId,
    desktopPublicKey: args.deviceKey.publicKey,
    expiresAt,
    tokenId: randomUUID(),
  };
  const payload = JSON.stringify(claims);
  const signature = signPayloadWithDeviceKey({
    runtimeRoot: args.runtimeRoot,
    payload,
  });
  const token = encodePairingToken(claims, signature);
  const webOrigin = (args.webOrigin ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    token,
    expiresAt,
    url: `${webOrigin}/pair?token=${encodeURIComponent(token)}`,
  };
}
