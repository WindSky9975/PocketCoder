import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDesktopControlRegistry } from "../../dist/platform/windows/control-registry.js";
import {
  createInputDetector,
  createManualInputDetector,
} from "../../dist/platform/windows/input-detector.js";
import { createSessionManager } from "../../dist/sessions/session-manager.js";
import { createSessionRegistry } from "../../dist/sessions/session-registry.js";
import { createCommandHandler } from "../../dist/transport/command-handler.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForCondition(
  predicate: () => boolean,
  timeoutMs = 1_500,
  intervalMs = 25,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return;
    }

    await sleep(intervalMs);
  }

  assert.fail(`condition was not met within ${timeoutMs}ms`);
}

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

  it("polls Windows last-input markers for watched sessions and stops after unwatch", async () => {
    const markers = ["100", "200", "300"];
    const signals: string[] = [];
    const detector = createInputDetector({
      platform: "win32",
      pollIntervalMs: 250,
      async lastInputReader() {
        return markers.shift() ?? "300";
      },
    });

    detector.subscribe((signal) => {
      signals.push(`${signal.sessionId}:${signal.kind}`);
      if (signals.length === 1) {
        detector.unwatchSession(signal.sessionId);
      }
    });

    detector.watchSession("session-1");
    await waitForCondition(() => signals.length === 1);

    const receivedAfterFirstSignal = signals.length;
    await sleep(450);
    detector.dispose();

    assert.deepEqual(signals, ["session-1:keyboard"]);
    assert.equal(receivedAfterFirstSignal, 1);
  });

  it("re-arms detector tracking when a recovered session is ensured again", () => {
    const listeners = new Set<(signal: { sessionId: string; detectedAt: string; kind: "keyboard" }) => void>();
    const watched: string[] = [];
    const unwatched: string[] = [];
    const detector = {
      subscribe(onInput: (signal: { sessionId: string; detectedAt: string; kind: "keyboard" }) => void) {
        listeners.add(onInput);
        return () => {
          listeners.delete(onInput);
        };
      },
      watchSession(sessionId: string) {
        watched.push(sessionId);
      },
      unwatchSession(sessionId: string) {
        unwatched.push(sessionId);
      },
      dispose() {
        listeners.clear();
      },
      emit(sessionId: string) {
        for (const listener of listeners) {
          listener({
            sessionId,
            detectedAt: "2026-04-03T10:00:00.000Z",
            kind: "keyboard",
          });
        }
      },
    };
    const desktopControl = createDesktopControlRegistry({ detector });

    desktopControl.ensureSession("session-1");
    detector.emit("session-1");

    assert.equal(desktopControl.canAcceptRemoteCommands("session-1"), false);
    assert.deepEqual(watched, ["session-1"]);
    assert.deepEqual(unwatched, ["session-1"]);

    desktopControl.ensureSession("session-1");
    const released = desktopControl.markRemoteControlReleased("session-1");

    assert.equal(desktopControl.canAcceptRemoteCommands("session-1"), false);
    assert.equal(released?.reason, "remote-control-revoked");
    assert.deepEqual(watched, ["session-1", "session-1"]);
    assert.deepEqual(unwatched, ["session-1", "session-1"]);
  });
});
