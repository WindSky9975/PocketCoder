import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createReplayService } from "../../dist/modules/replay/service.js";
import { createSessionRelayService } from "../../dist/modules/sessions/service.js";
import { inspectPairingToken, consumePairingToken } from "../../dist/security/token-service.js";
import { createRelayStorage } from "../../dist/storage/sqlite.js";
import { createConnectionRegistry } from "../../dist/transport/ws/connection-registry.js";

function createPairingToken(desktopDeviceId: string, expiresAt: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      desktopDeviceId,
      expiresAt,
      nonce: "unit-test",
    }),
    "utf8",
  ).toString("base64url");

  return `pair.v1.${payload}`;
}

describe("relay security and dedupe", () => {
  it("rejects expired tokens and consumes fresh tokens only once", () => {
    const storage = createRelayStorage();
    const nowIso = "2026-04-02T10:00:00.000Z";
    const freshToken = createPairingToken("desktop-1", "2026-04-02T10:05:00.000Z");
    const expiredToken = createPairingToken("desktop-2", "2026-04-02T09:59:00.000Z");

    const inspection = inspectPairingToken(storage.pairingRecords, freshToken, nowIso);
    assert.equal(inspection.accepted, true);
    assert.equal(inspection.desktopDeviceId, "desktop-1");

    const consumed = consumePairingToken(storage.pairingRecords, {
      token: freshToken,
      candidateDeviceId: "browser-1",
      candidateDeviceName: "Pixel",
      candidatePublicKey: "public-key",
      nowIso,
    });
    assert.equal(consumed.usedAt, nowIso);

    const secondInspection = inspectPairingToken(storage.pairingRecords, freshToken, nowIso);
    assert.equal(secondInspection.accepted, false);
    assert.equal(secondInspection.reason, "used");

    const expiredInspection = inspectPairingToken(storage.pairingRecords, expiredToken, nowIso);
    assert.equal(expiredInspection.accepted, false);
    assert.equal(expiredInspection.reason, "expired");
  });

  it("marks duplicate relay commands as dedupe hits after the first forward", () => {
    const storage = createRelayStorage();
    const connections = createConnectionRegistry();
    const replay = createReplayService(storage.replayEvents, 60_000);
    const sessions = createSessionRelayService({
      routes: storage.sessionRoutes,
      commandDedupe: storage.commandReceipts,
      replay,
      connections,
    });

    const desktopSocket = { readyState: 1, send() { /* noop */ } };
    const desktop = connections.register({
      deviceId: "desktop-1",
      role: "desktop",
      socket: desktopSocket,
    });

    storage.sessionRoutes.save({
      sessionId: "session-1",
      ownerDeviceId: desktop.deviceId,
      updatedAt: "2026-04-02T10:00:00.000Z",
    });

    const first = sessions.handleControlCommand(
      "browser-1",
      { deviceId: "browser-1", scopes: ["session:write"], revokedAt: null },
      {
        protocolVersion: "1.0.0",
        messageId: "cmd-1",
        timestamp: "2026-04-02T10:00:00.000Z",
        type: "SendPrompt",
        payload: {
          sessionId: "session-1",
          prompt: "hello",
        },
      },
    );
    assert.equal(first.ack.payload.accepted, true);
    assert.equal(first.target?.deviceId, "desktop-1");

    const duplicate = sessions.handleControlCommand(
      "browser-1",
      { deviceId: "browser-1", scopes: ["session:write"], revokedAt: null },
      {
        protocolVersion: "1.0.0",
        messageId: "cmd-1",
        timestamp: "2026-04-02T10:00:01.000Z",
        type: "SendPrompt",
        payload: {
          sessionId: "session-1",
          prompt: "hello again",
        },
      },
    );
    assert.equal(duplicate.ack.payload.accepted, false);
    assert.equal(duplicate.target, null);
  });
});
