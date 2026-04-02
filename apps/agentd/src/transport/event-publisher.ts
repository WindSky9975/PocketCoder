import {
  PROTOCOL_VERSION,
  createMessageId,
  sessionOutputDeltaEnvelopeSchema,
  sessionStateChangedEnvelopeSchema,
  sessionSummaryEnvelopeSchema,
  approvalRequestedEnvelopeSchema,
  type ProtocolEventEnvelope,
  type SessionStatus,
} from "@pocketcoder/protocol";

import type { CodexProviderEvent } from "../providers/codex/codex-parser.js";
import type { SessionRecord } from "../sessions/session-registry.js";
import type { RelayClient } from "./relay-client.js";

export interface AgentdEventPublisher {
  publishSessionSummary(record: SessionRecord): Promise<void>;
  publishProviderEvent(event: CodexProviderEvent, record: SessionRecord): Promise<void>;
}

export function createEventPublisher(relayClient: RelayClient): AgentdEventPublisher {
  return {
    async publishSessionSummary(record) {
      await relayClient.publish(
        sessionSummaryEnvelopeSchema.parse({
          protocolVersion: PROTOCOL_VERSION,
          messageId: createMessageId("evt"),
          timestamp: new Date().toISOString(),
          type: "SessionSummary",
          payload: {
            sessionId: record.sessionId,
            provider: record.provider,
            status: record.status,
            ...(record.currentTask ? { currentTask: record.currentTask } : {}),
            lastActivityAt: record.lastActivityAt,
          },
        }),
      );
    },
    async publishProviderEvent(event, record) {
      const outbound = mapProviderEvent(event, record);
      if (!outbound) {
        return;
      }

      await relayClient.publish(outbound);
    },
  };
}

function mapProviderEvent(
  event: CodexProviderEvent,
  record: SessionRecord,
): ProtocolEventEnvelope | null {
  const timestamp = new Date().toISOString();

  if (event.type === "session.output.delta") {
    return sessionOutputDeltaEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: createMessageId("evt"),
      timestamp,
      type: "SessionOutputDelta",
      payload: {
        sessionId: record.sessionId,
        stream: "stdout",
        delta: String(event.payload.chunk ?? ""),
      },
    });
  }

  if (event.type === "session.approval.requested") {
    return approvalRequestedEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: createMessageId("evt"),
      timestamp,
      type: "ApprovalRequested",
      payload: {
        sessionId: record.sessionId,
        approvalId: String(event.payload.approvalId ?? createMessageId("approval")),
        prompt: String(event.payload.prompt ?? "Approval required"),
        issuedAt: timestamp,
      },
    });
  }

  if (
    event.type === "session.started" ||
    event.type === "session.state.changed" ||
    event.type === "session.error" ||
    event.type === "session.ended"
  ) {
    const status =
      typeof event.payload.status === "string"
        ? (event.payload.status as SessionStatus)
        : record.status;

    return sessionStateChangedEnvelopeSchema.parse({
      protocolVersion: PROTOCOL_VERSION,
      messageId: createMessageId("evt"),
      timestamp,
      type: "SessionStateChanged",
      payload: {
        sessionId: record.sessionId,
        status,
        ...(typeof event.payload.reason === "string"
          ? { reason: event.payload.reason }
          : event.type === "session.error"
            ? { reason: "provider-error" }
            : {}),
      },
    });
  }

  return null;
}
