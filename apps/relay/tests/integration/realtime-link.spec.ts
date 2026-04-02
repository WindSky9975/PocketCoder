import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { describe, it } from "node:test";

import { buildApp } from "../../dist/app.js";

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

function createSocketHarness(url: string) {
  const socket = new WebSocket(url);
  const queuedMessages: Record<string, unknown>[] = [];
  const waiters: Array<(value: Record<string, unknown>) => void> = [];

  socket.addEventListener("message", (event) => {
    const parsed = JSON.parse(String(event.data)) as Record<string, unknown>;
    const waiter = waiters.shift();
    if (waiter) {
      waiter(parsed);
      return;
    }

    queuedMessages.push(parsed);
  });

  return {
    socket,
    waitForOpen(): Promise<void> {
      return new Promise((resolve, reject) => {
        socket.addEventListener("open", () => resolve(), { once: true });
        socket.addEventListener("error", (event) => reject(event), { once: true });
      });
    },
    nextMessage(timeoutMs = 3_000): Promise<Record<string, unknown>> {
      return new Promise((resolve, reject) => {
        const queued = queuedMessages.shift();
        if (queued) {
          resolve(queued);
          return;
        }

        const timer = setTimeout(
          () => reject(new Error("timed out waiting for websocket message")),
          timeoutMs,
        );

        waiters.push((value) => {
          clearTimeout(timer);
          resolve(value);
        });

        socket.addEventListener(
          "error",
          (event) => {
            clearTimeout(timer);
            reject(event);
          },
          { once: true },
        );
      });
    },
  };
}

function createRecentIso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

describe("relay realtime integration", () => {
  it("supports pairing, subscribe, replay, and command forwarding", async () => {
    const app = await buildApp({
      host: "127.0.0.1",
      port: 8787,
      publicOrigin: "http://127.0.0.1",
      replayWindowMs: 300_000,
    });

    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    assert.equal(typeof address, "object");
    const port = address && "port" in address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}`;
    const wsUrl = `ws://127.0.0.1:${port}/ws`;

    const desktopToken = createSignedPairingToken("desktop-1", "2099-01-01T00:05:00.000Z");

    try {
      const tokenResponse = await fetch(
        `${baseUrl}/pairing/token?value=${encodeURIComponent(desktopToken.token)}`,
      );
      assert.equal(tokenResponse.status, 200);
      const tokenInspection = (await tokenResponse.json()) as { accepted: boolean };
      assert.equal(tokenInspection.accepted, true);

      const pairingResponse = await fetch(`${baseUrl}/pairing/init`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          protocolVersion: "1.0.0",
          messageId: "pair-1",
          timestamp: createRecentIso(-10_000),
          type: "PairingInit",
          payload: {
            pairingToken: desktopToken.token,
            deviceName: "Pixel",
            publicKey: "browser-public-key",
          },
        }),
      });
      assert.equal(pairingResponse.status, 201);
      const pairingBody = (await pairingResponse.json()) as {
        desktopPublicKey: string;
        envelope: { payload: { deviceId: string } };
      };
      const browserDeviceId = pairingBody.envelope.payload.deviceId;
      assert.equal(browserDeviceId.startsWith("browser-"), true);
      assert.equal(pairingBody.desktopPublicKey, desktopToken.publicKey);

      const desktopSocket = createSocketHarness(
        `${wsUrl}?deviceId=desktop-1&role=desktop&publicKey=${encodeURIComponent(desktopToken.publicKey)}`,
      );
      const browserSocket = createSocketHarness(`${wsUrl}?deviceId=${browserDeviceId}&role=browser`);

      await Promise.all([desktopSocket.waitForOpen(), browserSocket.waitForOpen()]);
      await Promise.all([desktopSocket.nextMessage(), browserSocket.nextMessage()]);

      desktopSocket.socket.send(
        JSON.stringify({
          protocolVersion: "1.0.0",
          messageId: "evt-summary",
          timestamp: createRecentIso(-4_000),
          type: "SessionSummary",
          payload: {
            sessionId: "session-1",
            provider: "codex",
            status: "running",
            currentTask: "integration",
            lastActivityAt: createRecentIso(-4_000),
          },
        }),
      );
      desktopSocket.socket.send(
        JSON.stringify({
          protocolVersion: "1.0.0",
          messageId: "evt-output",
          timestamp: createRecentIso(-2_000),
          type: "SessionOutputDelta",
          payload: {
            sessionId: "session-1",
            stream: "stdout",
            delta: "relay replay payload",
          },
        }),
      );

      const sessionDirectoryResponse = await fetch(`${baseUrl}/sessions`, {
        headers: {
          "x-device-id": browserDeviceId,
          origin: "http://localhost:3000",
        },
      });
      assert.equal(sessionDirectoryResponse.status, 200);
      assert.equal(
        sessionDirectoryResponse.headers.get("access-control-allow-origin"),
        "http://localhost:3000",
      );
      const sessionDirectoryBody = (await sessionDirectoryResponse.json()) as {
        sessions: Array<{ sessionId: string; status: string; currentTask?: string }>;
      };
      assert.equal(sessionDirectoryBody.sessions.length, 1);
      assert.equal(sessionDirectoryBody.sessions[0]?.sessionId, "session-1");
      assert.equal(sessionDirectoryBody.sessions[0]?.status, "running");
      assert.equal(sessionDirectoryBody.sessions[0]?.currentTask, "integration");

      browserSocket.socket.send(
        JSON.stringify({
          protocolVersion: "1.0.0",
          messageId: "cmd-subscribe",
          timestamp: createRecentIso(-1_000),
          type: "SessionSubscribe",
          payload: {
            sessionId: "session-1",
          },
        }),
      );

      const subscribeAck = await browserSocket.nextMessage();
      const replayOne = await browserSocket.nextMessage();
      const replayTwo = await browserSocket.nextMessage();

      assert.equal(subscribeAck.type, "Ack");
      assert.equal((subscribeAck.payload as { accepted: boolean }).accepted, true);
      assert.deepEqual(
        [replayOne.type, replayTwo.type],
        ["SessionSummary", "SessionOutputDelta"],
      );

      browserSocket.socket.send(
        JSON.stringify({
          protocolVersion: "1.0.0",
          messageId: "cmd-prompt",
          timestamp: createRecentIso(),
          type: "SendPrompt",
          payload: {
            sessionId: "session-1",
            prompt: "subscribe, reconnect, replay",
          },
        }),
      );

      const [commandAck, forwardedCommand] = await Promise.all([
        browserSocket.nextMessage(),
        desktopSocket.nextMessage(),
      ]);

      assert.equal(commandAck.type, "Ack");
      assert.equal((commandAck.payload as { accepted: boolean }).accepted, true);
      assert.equal(forwardedCommand.type, "SendPrompt");
      assert.equal(
        (forwardedCommand.payload as { prompt: string }).prompt,
        "subscribe, reconnect, replay",
      );

      desktopSocket.socket.close();
      browserSocket.socket.close();
    } finally {
      await app.close();
    }
  });

  it("answers CORS preflight requests for browser HTTP calls", async () => {
    const app = await buildApp({
      host: "127.0.0.1",
      port: 8787,
      publicOrigin: "http://127.0.0.1",
      replayWindowMs: 300_000,
    });

    await app.listen({ host: "127.0.0.1", port: 0 });
    const address = app.server.address();
    assert.equal(typeof address, "object");
    const port = address && "port" in address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const response = await fetch(`${baseUrl}/pairing/init`, {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:3000",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      });

      assert.equal(response.status, 204);
      assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
      assert.equal(
        response.headers.get("access-control-allow-methods"),
        "GET, POST, OPTIONS",
      );
    } finally {
      await app.close();
    }
  });
});
