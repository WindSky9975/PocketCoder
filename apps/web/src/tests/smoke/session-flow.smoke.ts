import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, it } from "node:test";

import { PROTOCOL_VERSION } from "@pocketcoder/protocol";

import {
  createBrowserRelayClient,
  resolveRelayWebSocketUrl,
} from "../../lib/realtime/relay-client.ts";
import {
  loadOrCreateBrowserDeviceKeyRecord,
  type BrowserKeyStorageLike,
} from "../../lib/crypto/device-keyring.ts";

type MockListener = (event: { data?: string }) => void;

class MockWebSocket {
  static instances: MockWebSocket[] = [];

  readonly listeners = new Map<string, MockListener[]>();
  readonly sentFrames: string[] = [];
  readonly url: string;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.emit("open", {});
    });
  }

  addEventListener(type: string, listener: MockListener): void {
    const current = this.listeners.get(type) ?? [];
    current.push(listener);
    this.listeners.set(type, current);
  }

  send(data: string): void {
    this.sentFrames.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit("close", {});
  }

  receive(payload: unknown): void {
    this.emit("message", {
      data: JSON.stringify(payload),
    });
  }

  private emit(type: string, event: { data?: string }): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

const originalWebSocket = globalThis.WebSocket;
const originalLocalStorage = "localStorage" in globalThis ? globalThis.localStorage : undefined;

function createMemoryStorage(): BrowserKeyStorageLike & { removeItem(key: string): void } {
  const store = new Map<string, string>();

  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

afterEach(() => {
  MockWebSocket.instances = [];
  globalThis.WebSocket = originalWebSocket;
  if (originalLocalStorage) {
    globalThis.localStorage = originalLocalStorage;
    return;
  }

  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("pair to session-detail prompt main flow", () => {
  it("sends realtime commands and parses the session-detail event stream", async () => {
    const inboundTypes: string[] = [];
    const transportStates: string[] = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    const storage = createMemoryStorage();
    (globalThis as typeof globalThis & { localStorage: Storage }).localStorage =
      storage as unknown as Storage;
    await loadOrCreateBrowserDeviceKeyRecord({
      deviceId: "browser-1",
      storage,
    });
    const desktopIdentity = generateKeyPairSync("ec", {
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

    const client = createBrowserRelayClient({
      relayUrl: resolveRelayWebSocketUrl("https://relay.example"),
      pairedDevice: {
        deviceId: "browser-1",
        desktopDeviceId: "desktop-1",
        desktopPublicKey: desktopIdentity.publicKey,
        pairedAt: "2026-04-03T10:00:00.000Z",
        relayOrigin: "https://relay.example",
        accessScope: ["session:read", "session:write"],
      },
      createDeviceProof: async () => ({
        timestamp: "2026-04-03T10:00:00.000Z",
        signature: "browser-proof",
      }),
      onMessage(message) {
        inboundTypes.push(message.type);
      },
      onTransportStateChange(state) {
        transportStates.push(state);
      },
    });

    await client.connect();

    const socket = MockWebSocket.instances[0];
    assert.ok(socket);
    assert.equal(
      socket?.url,
      "wss://relay.example/ws?deviceId=browser-1&role=browser&proof=browser-proof&proofTimestamp=2026-04-03T10%3A00%3A00.000Z",
    );

    socket?.receive({
      type: "connected",
      deviceId: "browser-1",
      role: "browser",
    });

    await client.subscribe("session-detail-1");
    await client.sendPrompt("session-detail-1", "prompt from handset");
    await client.respondToApproval("session-detail-1", "approval-1", "allow");
    await client.resumeDesktopControl("session-detail-1");

    socket?.receive({
      protocolVersion: PROTOCOL_VERSION,
      messageId: "evt-1",
      timestamp: "2026-04-02T10:00:00.000Z",
      type: "SessionOutputDelta",
      payload: {
        sessionId: "session-detail-1",
        stream: "stdout",
        delta: "relay delivered prompt output",
      },
    });
    socket?.receive({
      protocolVersion: PROTOCOL_VERSION,
      messageId: "evt-2",
      timestamp: "2026-04-02T10:00:01.000Z",
      type: "ApprovalRequested",
      payload: {
        sessionId: "session-detail-1",
        approvalId: "approval-1",
        prompt: "Allow workspace write access?",
        issuedAt: "2026-04-02T10:00:01.000Z",
      },
    });

    const outboundTypes = socket?.sentFrames.map((frame) => {
      const parsed = JSON.parse(frame) as { type: string };
      return parsed.type;
    });

    assert.deepEqual(outboundTypes, [
      "SessionSubscribe",
      "SendPrompt",
      "ApprovalResponse",
      "ResumeDesktopControl",
    ]);
    assert.deepEqual(inboundTypes, ["connected", "SessionOutputDelta", "ApprovalRequested"]);

    socket?.close();
    await client.connect();

    const secondSocket = MockWebSocket.instances[1];
    assert.ok(secondSocket);
    assert.equal(
      secondSocket?.url,
      "wss://relay.example/ws?deviceId=browser-1&role=browser&proof=browser-proof&proofTimestamp=2026-04-03T10%3A00%3A00.000Z",
    );
    assert.deepEqual(transportStates, ["connected", "disconnected", "connected"]);
  });
});
