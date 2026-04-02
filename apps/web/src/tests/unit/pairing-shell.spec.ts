import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBrowserDeviceKeyRecord } from "../../lib/crypto/device-keyring.ts";
import {
  buildPairingStartPayload,
  startPairing,
} from "../../features/pairing/pairing-controller.ts";

describe("web pairing and approval surfaces", () => {
  it("builds a pairing payload with the browser public key", () => {
    const payload = buildPairingStartPayload({
      token: " pair-token ",
      deviceName: " Pixel 9 ",
      candidatePublicKey: " browser-public-key ",
    });

    assert.deepEqual(payload, {
      pairingToken: "pair-token",
      deviceName: "Pixel 9",
      publicKey: "browser-public-key",
    });
  });

  it("starts pairing through the relay and stores granted approval scopes", async () => {
    const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
    const keyRecord = createBrowserDeviceKeyRecord("browser-device");

    const result = await startPairing({
      relayOrigin: "http://relay.test",
      token: "pair-token",
      deviceName: "Pixel 9",
      keyRecord,
      fetchImpl: async (input, init) => {
        requests.push({
          url: String(input),
          body: JSON.parse(String(init?.body)) as Record<string, unknown>,
        });

        return {
          ok: true,
          status: 201,
          async json() {
            return {
              desktopDeviceId: "desktop-1",
              grantedScopes: ["session:read", "session:write"],
              envelope: {
                payload: {
                  deviceId: "browser-registered",
                  deviceName: "Pixel 9",
                  registeredAt: "2026-04-02T10:00:00.000Z",
                },
              },
            };
          },
        } as Response;
      },
    });

    assert.equal(requests[0]?.url, "http://relay.test/pairing/init");
    assert.equal(requests[0]?.body.type, "PairingInit");
    assert.equal(result.pairedDevice.deviceId, "browser-registered");
    assert.deepEqual(result.pairedDevice.accessScope, ["session:read", "session:write"]);
  });
});
