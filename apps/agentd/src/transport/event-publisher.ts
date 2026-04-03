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

import { createPairedBrowserRegistry } from "../security/paired-browser-registry.js";
import type { CodexProviderEvent } from "../providers/codex/codex-parser.js";
import type { PairedBrowserRegistry } from "../security/paired-browser-registry.js";
import { encryptAgentdPayload } from "../security/session-crypto.js";
import type { SessionRecord } from "../sessions/session-registry.js";
import type { RelayClient } from "./relay-client.js";

export interface AgentdEventPublisher {
  publishSessionSummary(record: SessionRecord): Promise<void>;
  publishSessionStateChange(record: SessionRecord, reason?: string): Promise<void>;
  publishProviderEvent(event: CodexProviderEvent, record: SessionRecord): Promise<void>;
}

export function createEventPublisher(
  input:
    | RelayClient
    | {
        relayClient: RelayClient;
        runtimeRoot: string;
        desktopDeviceId: string;
        pairedBrowsers: PairedBrowserRegistry;
      },
): AgentdEventPublisher {
  const compatibilityMode = !("relayClient" in input);
  const args =
    "relayClient" in input
      ? input
      : {
          relayClient: input,
          runtimeRoot: "",
          desktopDeviceId: "",
          pairedBrowsers: createPairedBrowserRegistry(),
        };

  async function publishToBrowsers(
    createEnvelope: (browser: ReturnType<PairedBrowserRegistry["list"]>[number]) => ProtocolEventEnvelope | null,
  ): Promise<void> {
    for (const browser of args.pairedBrowsers.listForDesktop(args.desktopDeviceId)) {
      const envelope = createEnvelope(browser);
      if (!envelope) {
        continue;
      }

      await args.relayClient.publish(envelope);
    }
  }

  return {
    async publishSessionSummary(record) {
      await args.relayClient.publish(
        sessionSummaryEnvelopeSchema.parse({
          protocolVersion: PROTOCOL_VERSION,
          messageId: createMessageId("evt"),
          timestamp: new Date().toISOString(),
          type: "SessionSummary",
          payload: {
            sessionId: record.sessionId,
            provider: record.provider,
            status: record.status,
            ...(compatibilityMode && record.currentTask ? { currentTask: record.currentTask } : {}),
            lastActivityAt: record.lastActivityAt,
          },
        }),
      );
      if (compatibilityMode) {
        return;
      }
      if (!record.currentTask) {
        return;
      }

      await publishToBrowsers((browser) => {
        const messageId = createMessageId("evt");
        return sessionSummaryEnvelopeSchema.parse({
          protocolVersion: PROTOCOL_VERSION,
          messageId,
          timestamp: new Date().toISOString(),
          type: "SessionSummary",
          payload: {
            sessionId: record.sessionId,
            provider: record.provider,
            status: record.status,
            lastActivityAt: record.lastActivityAt,
            encrypted: encryptAgentdPayload({
              runtimeRoot: args.runtimeRoot,
              senderDeviceId: args.desktopDeviceId,
              recipientDeviceId: browser.deviceId,
              recipientPublicKey: browser.publicKey,
              type: "SessionSummary",
              messageId,
              sessionId: record.sessionId,
              plaintext: {
                currentTask: record.currentTask,
              },
            }),
          },
        });
      });
    },
    async publishSessionStateChange(record, reason) {
      await args.relayClient.publish(createSessionStateChangedEnvelope(record, reason));
    },
    async publishProviderEvent(event, record) {
      if (compatibilityMode) {
        const outbound = mapCompatibilityProviderEvent(event, record);
        if (outbound) {
          await args.relayClient.publish(outbound);
        }
        return;
      }

      if (event.type === "session.output.delta") {
        await publishToBrowsers((browser) => {
          const messageId = createMessageId("evt");
          return sessionOutputDeltaEnvelopeSchema.parse({
            protocolVersion: PROTOCOL_VERSION,
            messageId,
            timestamp: new Date().toISOString(),
            type: "SessionOutputDelta",
            payload: {
              sessionId: record.sessionId,
              stream: "stdout",
              encrypted: encryptAgentdPayload({
                runtimeRoot: args.runtimeRoot,
                senderDeviceId: args.desktopDeviceId,
                recipientDeviceId: browser.deviceId,
                recipientPublicKey: browser.publicKey,
                type: "SessionOutputDelta",
                messageId,
                sessionId: record.sessionId,
                plaintext: {
                  delta: String(event.payload.chunk ?? ""),
                },
              }),
            },
          });
        });
        return;
      }

      if (event.type === "session.approval.requested") {
        await publishToBrowsers((browser) => {
          const messageId = createMessageId("evt");
          const issuedAt = new Date().toISOString();
          return approvalRequestedEnvelopeSchema.parse({
            protocolVersion: PROTOCOL_VERSION,
            messageId,
            timestamp: issuedAt,
            type: "ApprovalRequested",
            payload: {
              sessionId: record.sessionId,
              issuedAt,
              encrypted: encryptAgentdPayload({
                runtimeRoot: args.runtimeRoot,
                senderDeviceId: args.desktopDeviceId,
                recipientDeviceId: browser.deviceId,
                recipientPublicKey: browser.publicKey,
                type: "ApprovalRequested",
                messageId,
                sessionId: record.sessionId,
                plaintext: {
                  approvalId: String(event.payload.approvalId ?? createMessageId("approval")),
                  prompt: String(event.payload.prompt ?? "Approval required"),
                },
              }),
            },
          });
        });
        return;
      }

      const outbound = mapProviderEvent(event, record);
      if (!outbound) {
        return;
      }

      await args.relayClient.publish(outbound);
    },
  };
}

function mapProviderEvent(
  event: CodexProviderEvent,
  record: SessionRecord,
): ProtocolEventEnvelope | null {
  const timestamp = new Date().toISOString();

  if (
    event.type === "session.started" ||
    event.type === "session.state.changed" ||
    event.type === "session.error" ||
    event.type === "session.ended"
  ) {
    return createSessionStateChangedEnvelope(
      {
        ...record,
        status:
          typeof event.payload.status === "string"
            ? (event.payload.status as SessionStatus)
            : record.status,
      },
      typeof event.payload.reason === "string"
        ? event.payload.reason
        : event.type === "session.error"
          ? "provider-error"
          : undefined,
      timestamp,
    );
  }

  return null;
}

function mapCompatibilityProviderEvent(
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

  return mapProviderEvent(event, record);
}

function createSessionStateChangedEnvelope(
  record: SessionRecord,
  reason?: string,
  timestamp = new Date().toISOString(),
): Extract<ProtocolEventEnvelope, { type: "SessionStateChanged" }> {
  return sessionStateChangedEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    messageId: createMessageId("evt"),
    timestamp,
    type: "SessionStateChanged",
    payload: {
      sessionId: record.sessionId,
      status: record.status,
      ...(reason ? { reason } : {}),
    },
  });
}
