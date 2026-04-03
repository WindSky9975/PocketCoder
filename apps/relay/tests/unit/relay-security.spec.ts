import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { describe, it } from "node:test";

import { createReplayService } from "../../dist/modules/replay/service.js";
import { createSessionRelayService } from "../../dist/modules/sessions/service.js";
import { verifyDeviceProof } from "../../dist/security/device-proof.js";
import { inspectPairingToken, consumePairingToken } from "../../dist/security/token-service.js";
import { createRelayStorage } from "../../dist/storage/sqlite.js";
import { createConnectionRegistry } from "../../dist/transport/ws/connection-registry.js";

function createSignedPairingToken(desktopDeviceId: string, expiresAt: string) {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    privateKeyEncoding: {
      format: "pem",
      type: "pkcs8",
    },
    publicKeyEncoding: {
      format: "pem",
      type: "spki",
    },
  });
  const claims = {
    desktopDeviceId,
    desktopPublicKey: publicKey,
    expiresAt,
    tokenId: `${desktopDeviceId}-token`,
  };
  const payloadJson = JSON.stringify(claims);
  const payload = Buffer.from(payloadJson, "utf8").toString("base64url");
  const signature = sign("sha256", Buffer.from(payloadJson, "utf8"), privateKey).toString(
    "base64url",
  );

  return {
    token: `pair.v1.${payload}.${signature}`,
    publicKey,
  };
}

function createDeviceProof(args: {
  deviceId: string;
  role: "desktop" | "browser";
  timestamp: string;
  privateKey: string;
}) {
  return sign(
    "sha256",
    Buffer.from(
      JSON.stringify({
        deviceId: args.deviceId,
        role: args.role,
        timestamp: args.timestamp,
      }),
      "utf8",
    ),
    args.privateKey,
  ).toString("base64url");
}

describe("relay security and dedupe", () => {
  it("rejects expired tokens and consumes fresh tokens only once", () => {
    const storage = createRelayStorage();
    const nowIso = "2026-04-02T10:00:00.000Z";
    const freshToken = createSignedPairingToken("desktop-1", "2026-04-02T10:05:00.000Z");
    const expiredToken = createSignedPairingToken("desktop-2", "2026-04-02T09:59:00.000Z");

    const inspection = inspectPairingToken(storage.pairingRecords, freshToken.token, nowIso);
    assert.equal(inspection.accepted, true);
    assert.equal(inspection.desktopDeviceId, "desktop-1");
    assert.equal(inspection.desktopPublicKey, freshToken.publicKey);

    const consumed = consumePairingToken(storage.pairingRecords, {
      token: freshToken.token,
      candidateDeviceId: "browser-1",
      candidateDeviceName: "Pixel",
      candidatePublicKey: "public-key",
      nowIso,
    });
    assert.equal(consumed.usedAt, nowIso);

    const secondInspection = inspectPairingToken(storage.pairingRecords, freshToken.token, nowIso);
    assert.equal(secondInspection.accepted, false);
    assert.equal(secondInspection.reason, "used");

    const expiredInspection = inspectPairingToken(storage.pairingRecords, expiredToken.token, nowIso);
    assert.equal(expiredInspection.accepted, false);
    assert.equal(expiredInspection.reason, "expired");
  });

  it("rejects pairing tokens whose signature no longer matches the declared desktop key", () => {
    const storage = createRelayStorage();
    const signedToken = createSignedPairingToken("desktop-1", "2026-04-02T10:05:00.000Z");
    const [prefix, version, encodedPayload, signature] = signedToken.token.split(".");
    const payload = JSON.parse(Buffer.from(String(encodedPayload), "base64url").toString("utf8")) as {
      desktopDeviceId: string;
      desktopPublicKey: string;
      expiresAt: string;
      tokenId: string;
    };
    payload.desktopDeviceId = "desktop-9";
    const tamperedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    const tamperedToken = `${prefix}.${version}.${tamperedPayload}.${signature}`;

    const inspection = inspectPairingToken(
      storage.pairingRecords,
      tamperedToken,
      "2026-04-02T10:00:00.000Z",
    );

    assert.equal(inspection.accepted, false);
    assert.equal(inspection.reason, "untrusted");
  });

  it("verifies signed device proofs only inside the accepted time window", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
      privateKeyEncoding: {
        format: "pem",
        type: "pkcs8",
      },
      publicKeyEncoding: {
        format: "pem",
        type: "spki",
      },
    });
    const timestamp = "2026-04-03T10:00:00.000Z";
    const signature = createDeviceProof({
      deviceId: "browser-1",
      role: "browser",
      timestamp,
      privateKey,
    });

    assert.equal(
      verifyDeviceProof({
        deviceId: "browser-1",
        role: "browser",
        timestamp,
        signature,
        publicKey,
        nowIso: "2026-04-03T10:02:00.000Z",
      }),
      true,
    );
    assert.equal(
      verifyDeviceProof({
        deviceId: "browser-1",
        role: "browser",
        timestamp,
        signature,
        publicKey,
        nowIso: "2026-04-03T10:10:01.000Z",
      }),
      false,
    );
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

  it("builds a browser-scoped session directory from relay metadata", () => {
    const storage = createRelayStorage();
    const connections = createConnectionRegistry();
    const replay = createReplayService(storage.replayEvents, 60_000);
    const sessions = createSessionRelayService({
      routes: storage.sessionRoutes,
      commandDedupe: storage.commandReceipts,
      replay,
      connections,
    });

    storage.sessionRoutes.save({
      sessionId: "session-1",
      ownerDeviceId: "desktop-1",
      provider: "codex",
      status: "running",
      currentTask: "inspect relay health",
      lastActivityAt: "2026-04-02T10:00:00.000Z",
      updatedAt: "2026-04-02T10:00:00.000Z",
    });
    storage.sessionRoutes.save({
      sessionId: "session-2",
      ownerDeviceId: "desktop-2",
      provider: "codex",
      status: "idle",
      lastActivityAt: "2026-04-02T09:00:00.000Z",
      updatedAt: "2026-04-02T09:00:00.000Z",
    });

    const directory = sessions.listSessionDirectory({
      grant: {
        deviceId: "browser-1",
        scopes: ["session:read"],
        revokedAt: null,
      },
      pairedDesktopDeviceId: "desktop-1",
    });

    assert.equal(directory.sessions.length, 1);
    assert.equal(directory.sessions[0]?.sessionId, "session-1");
    assert.equal(directory.sessions[0]?.currentTask, "inspect relay health");
  });

  it("returns the latest session summary on subscribe even when replay history is empty", () => {
    const storage = createRelayStorage();
    const connections = createConnectionRegistry();
    const replay = createReplayService(storage.replayEvents, 60_000);
    const sessions = createSessionRelayService({
      routes: storage.sessionRoutes,
      commandDedupe: storage.commandReceipts,
      replay,
      connections,
    });

    const browserSocket = { readyState: 1, send() { /* noop */ } };
    const browserConnection = connections.register({
      deviceId: "browser-1",
      role: "browser",
      socket: browserSocket,
    });

    storage.sessionRoutes.save({
      sessionId: "session-1",
      ownerDeviceId: "desktop-1",
      provider: "codex",
      status: "running",
      currentTask: "inspect relay health",
      lastActivityAt: "2026-04-02T10:00:00.000Z",
      updatedAt: "2026-04-02T10:00:00.000Z",
    });

    const subscription = sessions.handleSessionSubscribe(
      browserConnection.connectionId,
      {
        deviceId: "browser-1",
        scopes: ["session:read"],
        revokedAt: null,
      },
      {
        protocolVersion: "1.0.0",
        messageId: "cmd-subscribe",
        timestamp: "2026-04-02T10:05:00.000Z",
        type: "SessionSubscribe",
        payload: {
          sessionId: "session-1",
        },
      },
    );

    assert.equal(subscription.replay.length, 1);
    assert.equal(subscription.replay[0]?.type, "SessionSummary");
    assert.equal(subscription.replay[0]?.payload.sessionId, "session-1");
  });

  it("rejects remote commands after desktop control has been recovered locally", () => {
    const storage = createRelayStorage();
    const connections = createConnectionRegistry();
    const replay = createReplayService(storage.replayEvents, 60_000);
    const sessions = createSessionRelayService({
      routes: storage.sessionRoutes,
      commandDedupe: storage.commandReceipts,
      replay,
      connections,
    });

    storage.sessionRoutes.save({
      sessionId: "session-1",
      ownerDeviceId: "desktop-1",
      provider: "codex",
      status: "disconnected",
      lastStateReason: "local-recovery",
      lastActivityAt: "2026-04-03T10:00:00.000Z",
      updatedAt: "2026-04-03T10:00:00.000Z",
    });

    assert.throws(
      () =>
        sessions.handleControlCommand(
          "browser-1",
          { deviceId: "browser-1", scopes: ["session:write"], revokedAt: null },
          {
            protocolVersion: "1.0.0",
            messageId: "cmd-after-recovery",
            timestamp: "2026-04-03T10:00:01.000Z",
            type: "SendPrompt",
            payload: {
              sessionId: "session-1",
              prompt: "should be rejected",
            },
          },
        ),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        error.code === "REMOTE_CONTROL_REVOKED",
    );
  });
});
