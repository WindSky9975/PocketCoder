import { signPayloadWithDeviceKey } from "./device-keys.js";

export interface DesktopDeviceProof {
  timestamp: string;
  signature: string;
}

function createDeviceProofPayload(args: {
  deviceId: string;
  role: "desktop";
  timestamp: string;
}): string {
  return JSON.stringify(args);
}

export function createDesktopDeviceProofSigner(args: {
  runtimeRoot: string;
  deviceId: string;
}): () => Promise<DesktopDeviceProof> {
  return async () => {
    const timestamp = new Date().toISOString();
    const signature = signPayloadWithDeviceKey({
      runtimeRoot: args.runtimeRoot,
      payload: createDeviceProofPayload({
        deviceId: args.deviceId,
        role: "desktop",
        timestamp,
      }),
    });

    return {
      timestamp,
      signature,
    };
  };
}
