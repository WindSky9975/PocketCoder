import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createBrowserDeviceKeyRecord } from "../../lib/crypto/device-keyring.ts";
import {
  buildPairingStartPayload,
  inspectPairingToken,
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
              desktopPublicKey: "desktop-public-key",
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
    assert.equal(result.desktopPublicKey, "desktop-public-key");
    assert.equal(result.pairedDevice.desktopDeviceId, "desktop-1");
    assert.deepEqual(result.pairedDevice.accessScope, ["session:read", "session:write"]);
  });

  it("inspects pairing tokens through the relay before the browser starts pairing", async () => {
    const requests: string[] = [];

    const inspection = await inspectPairingToken({
      relayOrigin: "http://relay.test",
      token: "pair-token",
      fetchImpl: async (input) => {
        requests.push(String(input));
        return {
          ok: true,
          status: 200,
          async json() {
            return {
              accepted: true,
              desktopDeviceId: "desktop-1",
              expiresAt: "2026-04-03T12:00:00.000Z",
            };
          },
        } as Response;
      },
    });

    assert.equal(requests[0], "http://relay.test/pairing/token?value=pair-token");
    assert.equal(inspection.accepted, true);
    assert.equal(inspection.desktopDeviceId, "desktop-1");
  });

  it("returns rejected token reasons from the relay inspection entrypoint", async () => {
    const inspection = await inspectPairingToken({
      relayOrigin: "http://relay.test",
      token: "expired-token",
      fetchImpl: async () =>
        ({
          ok: true,
          status: 200,
          async json() {
            return {
              accepted: false,
              reason: "expired",
            };
          },
        }) as Response,
    });

    assert.equal(inspection.accepted, false);
    assert.equal(inspection.reason, "expired");
  });
});
