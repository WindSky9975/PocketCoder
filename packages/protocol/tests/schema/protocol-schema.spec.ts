import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PROTOCOL_VERSION,
  protocolCommandEnvelopeSchema,
  protocolEnvelopeSchema,
  protocolEventEnvelopeSchema,
  protocolResponseEnvelopeSchema,
  pairingInitEnvelopeSchema,
  sessionDirectoryResponseSchema,
  sessionStateChangedEnvelopeSchema,
} from "../../dist/index.js";

describe("protocol schemas", () => {
  it("parses pairing envelopes through the dedicated pairing schema", () => {
    const parsed = pairingInitEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: "pair-1",
      timestamp: "2026-04-02T10:00:00.000Z",
      type: "PairingInit",
      payload: {
        pairingToken: "pair-token",
        deviceName: "Pixel 9",
        publicKey: "public-key",
      },
    });

    assert.equal(parsed.type, "PairingInit");
    assert.equal(parsed.payload.deviceName, "Pixel 9");
  });

  it("parses valid command envelopes through the command union", () => {
    const parsed = protocolCommandEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: "cmd-1",
      timestamp: "2026-04-02T10:00:00.000Z",
      type: "SendPrompt",
      payload: {
        sessionId: "session-1",
        prompt: "inspect the workspace",
      },
    });

    assert.equal(parsed.type, "SendPrompt");
    assert.equal(parsed.payload.prompt, "inspect the workspace");
  });

  it("rejects envelopes that omit messageId", () => {
    const result = protocolEnvelopeSchema.safeParse({
      protocolVersion: PROTOCOL_VERSION,
      timestamp: "2026-04-02T10:00:00.000Z",
      type: "SessionSubscribe",
      payload: {
        sessionId: "session-1",
      },
    });

    assert.equal(result.success, false);
  });

  it("rejects invalid session status values", () => {
    const result = sessionStateChangedEnvelopeSchema.safeParse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: "evt-1",
      timestamp: "2026-04-02T10:00:00.000Z",
      type: "SessionStateChanged",
      payload: {
        sessionId: "session-1",
        status: "paused",
      },
    });

    assert.equal(result.success, false);
  });

  it("parses event envelopes through the event union", () => {
    const parsed = protocolEventEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: "evt-2",
      timestamp: "2026-04-02T10:00:00.000Z",
      type: "ApprovalRequested",
      payload: {
        sessionId: "session-1",
        approvalId: "approval-1",
        prompt: "allow write access",
        issuedAt: "2026-04-02T10:00:00.000Z",
      },
    });

    assert.equal(parsed.type, "ApprovalRequested");
    assert.equal(parsed.payload.approvalId, "approval-1");
  });

  it("applies error defaults through the response union", () => {
    const parsed = protocolResponseEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: "err-1",
      timestamp: "2026-04-02T10:00:00.000Z",
      type: "ErrorEnvelope",
      payload: {
        code: "INVALID_MESSAGE",
        message: "bad payload",
      },
    });

    assert.equal(parsed.type, "ErrorEnvelope");
    assert.equal(parsed.payload.retryable, false);
  });

  it("parses session directory responses through the shared session schema", () => {
    const parsed = sessionDirectoryResponseSchema.parse({
      sessions: [
        {
          sessionId: "session-1",
          provider: "codex",
          status: "running",
          currentTask: "inspect relay session index",
          lastActivityAt: "2026-04-02T10:00:00.000Z",
        },
      ],
    });

    assert.equal(parsed.sessions[0]?.sessionId, "session-1");
    assert.equal(parsed.sessions[0]?.provider, "codex");
  });
});
