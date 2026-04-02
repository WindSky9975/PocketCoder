import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { createCodexSessionAdapter } from "../../dist/providers/codex/codex-session-adapter.js";
import {
  loadOrCreateDeviceKeyRecord,
  signPayloadWithDeviceKey,
  verifyDeviceSignature,
} from "../../dist/security/device-keys.js";
import { createSessionManager } from "../../dist/sessions/session-manager.js";
import { createSessionRegistry } from "../../dist/sessions/session-registry.js";
import { createCommandHandler } from "../../dist/transport/command-handler.js";
import { createEventPublisher } from "../../dist/transport/event-publisher.js";
import { createRelayClient } from "../../dist/transport/relay-client.js";
import { resolveAgentdPaths } from "../../dist/infra/paths.js";

describe("agentd event flow and approval handoff", () => {
  it("maps provider events into protocol envelopes for approval and session updates", async () => {
    const published: unknown[] = [];
    const relayClient = {
      async connect() {
        return undefined;
      },
      async publish(message: unknown) {
        published.push(message);
      },
      async disconnect() {
        return undefined;
      },
    };

    const sessionManager = createSessionManager(createSessionRegistry());
    const eventPublisher = createEventPublisher(relayClient);
    const adapter = createCodexSessionAdapter(sessionManager, eventPublisher);

    await adapter.apply({
      type: "session.started",
      payload: { sessionId: "session-1" },
    });
    await adapter.apply({
      type: "session.approval.requested",
      payload: {
        sessionId: "session-1",
        approvalId: "approval-1",
        prompt: "allow workspace write",
      },
    });

    assert.deepEqual(
      published.map((message) => (message as { type: string }).type),
      ["SessionSummary", "SessionStateChanged", "ApprovalRequested"],
    );
    assert.equal(
      (
        published[2] as {
          payload: { approvalId: string; prompt: string };
        }
      ).payload.approvalId,
      "approval-1",
    );
  });

  it("dispatches websocket commands back into agentd without losing idempotency boundaries", async () => {
    const sentPayloads: string[] = [];
    const receivedCommands: Array<{ type: string; payload: Record<string, unknown> }> = [];

    class FakeWebSocket {
      static instances: FakeWebSocket[] = [];
      readonly url: string;
      readyState = 0;
      private readonly listeners = new Map<string, Array<(event: { data?: unknown }) => void>>();

      constructor(url: string) {
        this.url = url;
        FakeWebSocket.instances.push(this);
        queueMicrotask(() => {
          this.readyState = 1;
          this.emit("open", {});
        });
      }

      addEventListener(type: string, listener: (event: { data?: unknown }) => void): void {
        const current = this.listeners.get(type) ?? [];
        current.push(listener);
        this.listeners.set(type, current);
      }

      send(data: string): void {
        sentPayloads.push(data);
      }

      close(): void {
        this.readyState = 3;
      }

      emit(type: string, event: { data?: unknown }): void {
        for (const listener of this.listeners.get(type) ?? []) {
          listener(event);
        }
      }
    }

    const originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;

    try {
      const relayClient = createRelayClient({
        relayUrl: "ws://127.0.0.1:8787/ws",
        deviceId: "desktop-1",
        publicKey: "desktop-public-key",
        onCommand: async (command) => {
          receivedCommands.push(command);
        },
      });

      await relayClient.connect();

      assert.equal(FakeWebSocket.instances.length, 1);
      assert.equal(
        FakeWebSocket.instances[0]?.url.includes(
          "deviceId=desktop-1&role=desktop&publicKey=desktop-public-key",
        ),
        true,
      );

      await relayClient.publish({
        protocolVersion: "1.0.0",
        messageId: "evt-1",
        timestamp: "2026-04-02T10:00:00.000Z",
        type: "SessionSummary",
        payload: {
          sessionId: "session-1",
          provider: "codex",
          status: "running",
          lastActivityAt: "2026-04-02T10:00:00.000Z",
        },
      });
      assert.equal(sentPayloads.length, 1);

      FakeWebSocket.instances[0]?.emit("message", {
        data: JSON.stringify({
          protocolVersion: "1.0.0",
          messageId: "cmd-1",
          timestamp: "2026-04-02T10:00:01.000Z",
          type: "SendPrompt",
          payload: {
            sessionId: "session-1",
            prompt: "event-flow approval idempotency",
          },
        }),
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      assert.equal(receivedCommands.length, 1);
      assert.equal(receivedCommands[0]?.type, "SendPrompt");
    } finally {
      globalThis.WebSocket = originalWebSocket;
    }
  });

  it("persists the desktop identity and signs payloads with the stored private key", () => {
    const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pocketcoder-agentd-"));

    const deviceKey = loadOrCreateDeviceKeyRecord({
      runtimeRoot,
      deviceId: "desktop-1",
    });
    const again = loadOrCreateDeviceKeyRecord({
      runtimeRoot,
      deviceId: "desktop-1",
    });
    const payload = JSON.stringify({
      desktopDeviceId: "desktop-1",
      desktopPublicKey: deviceKey.publicKey,
      expiresAt: "2099-01-01T00:05:00.000Z",
      tokenId: "desktop-1-token",
    });
    const signature = signPayloadWithDeviceKey({
      runtimeRoot,
      payload,
    });

    assert.equal(again.publicKey, deviceKey.publicKey);
    assert.equal(
      verifyDeviceSignature({
        publicKey: deviceKey.publicKey,
        payload,
        signature,
      }),
      true,
    );
  });

  it("returns updated session records when relay commands change local session status", async () => {
    const sessionManager = createSessionManager(createSessionRegistry());
    const codexWrites: string[] = [];
    const commandHandler = createCommandHandler(sessionManager, {
      async start() {
        return undefined;
      },
      async write(input: string) {
        codexWrites.push(input);
      },
      async stop() {
        codexWrites.push("__stopped__");
      },
    });

    sessionManager.openSession("session-1", "codex");

    const running = await commandHandler.handle({
      type: "SendPrompt",
      payload: {
        sessionId: "session-1",
        prompt: "inspect session route metadata",
      },
    });
    const disconnected = await commandHandler.handle({
      type: "InterruptSession",
      payload: {
        sessionId: "session-1",
      },
    });

    assert.equal(codexWrites[0], "inspect session route metadata");
    assert.equal(codexWrites[1], "__stopped__");
    assert.equal(running?.status, "running");
    assert.equal(disconnected?.status, "disconnected");
  });

  it("keeps the runtime root anchored to the agent workspace instead of process cwd", () => {
    const paths = resolveAgentdPaths();

    assert.equal(
      paths.runtimeRoot.endsWith(path.join("apps", "agentd", ".agentd")),
      true,
    );
  });
});
