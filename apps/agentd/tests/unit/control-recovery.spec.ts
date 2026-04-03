import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDesktopControlRegistry } from "../../dist/platform/windows/control-registry.js";
import { createManualInputDetector } from "../../dist/platform/windows/input-detector.js";
import { createSessionManager } from "../../dist/sessions/session-manager.js";
import { createSessionRegistry } from "../../dist/sessions/session-registry.js";
import { createCommandHandler } from "../../dist/transport/command-handler.js";

describe("agentd desktop control recovery", () => {
  it("marks the session as locally recovered and blocks later remote commands", async () => {
    const detector = createManualInputDetector();
    const recoveries: string[] = [];
    const desktopControl = createDesktopControlRegistry({
      detector,
      onRecovered(event) {
        recoveries.push(`${event.sessionId}:${event.reason}`);
      },
    });
    const sessionManager = createSessionManager(createSessionRegistry());
    const writes: string[] = [];
    const commandHandler = createCommandHandler(
      sessionManager,
      {
        async start() {
          return undefined;
        },
        async write(input: string) {
          writes.push(input);
        },
        async stop() {
          writes.push("__stopped__");
        },
      },
      desktopControl,
    );

    sessionManager.openSession("session-1", "codex");
    desktopControl.ensureSession("session-1");
    detector.emit({
      sessionId: "session-1",
      detectedAt: "2026-04-03T10:00:00.000Z",
      kind: "keyboard",
    });

    const blocked = await commandHandler.handle({
      type: "SendPrompt",
      payload: {
        sessionId: "session-1",
        prompt: "should be blocked",
      },
    });

    assert.deepEqual(recoveries, ["session-1:local-recovery"]);
    assert.equal(writes.length, 0);
    assert.equal(blocked.rejectedReason, "remote-control-revoked");
    assert.equal(desktopControl.canAcceptRemoteCommands("session-1"), false);
  });

  it("maps resumeDesktopControl into the same revoked state used by local recovery", async () => {
    const desktopControl = createDesktopControlRegistry();
    const sessionManager = createSessionManager(createSessionRegistry());
    const commandHandler = createCommandHandler(
      sessionManager,
      {
        async start() {
          return undefined;
        },
        async write() {
          return undefined;
        },
        async stop() {
          return undefined;
        },
      },
      desktopControl,
    );

    sessionManager.openSession("session-1", "codex");
    desktopControl.ensureSession("session-1");

    const result = await commandHandler.handle({
      type: "ResumeDesktopControl",
      payload: {
        sessionId: "session-1",
      },
    });

    assert.equal(result.updatedSession?.status, "disconnected");
    assert.equal(result.stateChangeReason, "remote-control-revoked");
    assert.equal(desktopControl.canAcceptRemoteCommands("session-1"), false);
  });
});
