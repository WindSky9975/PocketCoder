import {
  signBrowserPayload,
  type BrowserKeyStorageLike,
} from "./device-keyring.ts";

export interface BrowserDeviceProof {
  timestamp: string;
  signature: string;
}

function createDeviceProofPayload(args: {
  deviceId: string;
  role: "browser";
  timestamp: string;
}): string {
  return JSON.stringify(args);
}

export async function createBrowserDeviceProof(args: {
  deviceId: string;
  storage?: BrowserKeyStorageLike;
}): Promise<BrowserDeviceProof> {
  const timestamp = new Date().toISOString();
  const signature = await signBrowserPayload({
    payload: createDeviceProofPayload({
      deviceId: args.deviceId,
      role: "browser",
      timestamp,
    }),
    storage: args.storage,
  });

  return {
    timestamp,
    signature,
  };
}
