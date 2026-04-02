import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMAND_MESSAGE_TYPE_VALUES,
  EVENT_MESSAGE_TYPE_VALUES,
  MESSAGE_TYPE_VALUES,
  RESPONSE_MESSAGE_TYPE_VALUES,
  SESSION_STATUS_VALUES,
  createMessageId,
  normalizeMessageId,
} from "../../dist/index.js";

describe("protocol compatibility", () => {
  it("keeps the V1 message catalog stable", () => {
    assert.deepEqual(MESSAGE_TYPE_VALUES, [
      "PairingInit",
      "PairingConfirm",
      "DeviceRegistered",
      "SessionSummary",
      "SessionSubscribe",
      "SessionOutputDelta",
      "SessionStateChanged",
      "ApprovalRequested",
      "ApprovalResponse",
      "SendPrompt",
      "InterruptSession",
      "ResumeDesktopControl",
      "Ack",
      "ErrorEnvelope",
    ]);
  });

  it("keeps command, event, and response categories stable", () => {
    assert.deepEqual(COMMAND_MESSAGE_TYPE_VALUES, [
      "PairingInit",
      "PairingConfirm",
      "SessionSubscribe",
      "ApprovalResponse",
      "SendPrompt",
      "InterruptSession",
      "ResumeDesktopControl",
    ]);
    assert.deepEqual(EVENT_MESSAGE_TYPE_VALUES, [
      "DeviceRegistered",
      "SessionSummary",
      "SessionOutputDelta",
      "SessionStateChanged",
      "ApprovalRequested",
    ]);
    assert.deepEqual(RESPONSE_MESSAGE_TYPE_VALUES, ["Ack", "ErrorEnvelope"]);
  });

  it("keeps the V1 session status vocabulary stable", () => {
    assert.deepEqual(SESSION_STATUS_VALUES, [
      "idle",
      "running",
      "waiting_input",
      "waiting_approval",
      "error",
      "disconnected",
    ]);
  });

  it("keeps messageId helpers stable for callers", () => {
    const created = createMessageId("cmd");

    assert.equal(created.startsWith("cmd_"), true);
    assert.equal(normalizeMessageId("  msg-1  "), "msg-1");
  });
});
