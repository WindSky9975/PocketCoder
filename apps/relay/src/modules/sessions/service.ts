import {
  PROTOCOL_VERSION,
  createMessageId,
  sessionSummaryEnvelopeSchema,
  sessionDirectoryResponseSchema,
  type ProtocolCommandEnvelope,
  type ProtocolEventEnvelope,
  type SessionSummaryPayload,
} from "@pocketcoder/protocol";

import { RelayProtocolError } from "../../infra/protocol-error.js";
import { assertSessionScope } from "../../security/access-control.js";
import type { DeviceGrant } from "../../security/device-registry.js";
import type { CommandDedupeRepository } from "../../storage/repositories/command-dedupe-repository.js";
import type {
  SessionRouteRecord,
  SessionRouteRepository,
} from "../../storage/repositories/session-route-repository.js";
import { createAckEnvelope } from "../../transport/protocol-messages.js";
import type { ConnectionRegistry, ConnectionRecord } from "../../transport/ws/connection-registry.js";
import type { ReplayService } from "../replay/service.js";

type SessionSubscribeEnvelope = Extract<ProtocolCommandEnvelope, { type: "SessionSubscribe" }>;
type SessionControlEnvelope = Exclude<
  ProtocolCommandEnvelope,
  { type: "SessionSubscribe" | "PairingInit" | "PairingConfirm" }
>;

export interface SessionRelayService {
  handleRealtimeEvent(sourceConnectionId: string, sourceDeviceId: string, envelope: ProtocolEventEnvelope): void;
  listSessionDirectory(args: {
    grant: DeviceGrant | null;
    pairedDesktopDeviceId: string | null;
  }): ReturnType<typeof sessionDirectoryResponseSchema.parse>;
  handleSessionSubscribe(
    connectionId: string,
    grant: DeviceGrant | null,
    envelope: SessionSubscribeEnvelope,
  ): {
    ack: ReturnType<typeof createAckEnvelope>;
    replay: ProtocolEventEnvelope[];
  };
  handleControlCommand(
    sourceDeviceId: string,
    grant: DeviceGrant | null,
    envelope: SessionControlEnvelope,
  ): {
    ack: ReturnType<typeof createAckEnvelope>;
    target: ConnectionRecord | null;
  };
}

function readSessionId(payload: unknown): string {
  const sessionId =
    typeof payload === "object" && payload !== null && "sessionId" in payload
      ? (payload as { sessionId?: unknown }).sessionId
      : undefined;
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    throw new RelayProtocolError({
      code: "INVALID_MESSAGE",
      statusCode: 400,
      message: "protocol envelope is missing a valid sessionId",
    });
  }

  return sessionId;
}

export function createSessionRelayService(args: {
  routes: SessionRouteRepository;
  commandDedupe: CommandDedupeRepository;
  replay: ReplayService;
  connections: ConnectionRegistry;
}): SessionRelayService {
  return {
    handleRealtimeEvent(sourceConnectionId, sourceDeviceId, envelope) {
      const sessionId = readSessionId(envelope.payload);
      const currentRoute = args.routes.get(sessionId);
      args.routes.save(
        buildSessionRouteRecord({
          currentRoute,
          sourceDeviceId,
          envelope,
        }),
      );

      args.replay.record(envelope);

      for (const subscriber of args.connections.listSubscribers(sessionId)) {
        if (subscriber.connectionId === sourceConnectionId) {
          continue;
        }

        args.connections.send(subscriber.connectionId, JSON.stringify(envelope));
      }
    },
    listSessionDirectory({ grant, pairedDesktopDeviceId }) {
      assertSessionScope(grant, "session:read");

      if (!pairedDesktopDeviceId) {
        return sessionDirectoryResponseSchema.parse({ sessions: [] });
      }

      const sessions = args.routes
        .list()
        .filter((route) => route.ownerDeviceId === pairedDesktopDeviceId)
        .map(toSessionSummaryPayload)
        .filter((summary): summary is SessionSummaryPayload => summary !== null)
        .sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt));

      return sessionDirectoryResponseSchema.parse({
        sessions,
      });
    },
    handleSessionSubscribe(connectionId, grant, envelope) {
      assertSessionScope(grant, "session:read");

      const sessionId = readSessionId(envelope.payload);
      args.connections.subscribe(connectionId, sessionId);
      const sessionSnapshot = toSessionSummaryPayload(args.routes.get(sessionId));
      const replay = args.replay
        .listRecent(sessionId)
        .filter((replayEnvelope) => replayEnvelope.type !== "SessionSummary");

      return {
        ack: createAckEnvelope(envelope.messageId, true, `subscribed to ${sessionId}`),
        replay: sessionSnapshot
          ? [createSessionSummaryEnvelope(sessionSnapshot), ...replay]
          : replay,
      };
    },
    handleControlCommand(sourceDeviceId, grant, envelope) {
      assertSessionScope(grant, "session:write");

      if (args.commandDedupe.has(sourceDeviceId, envelope.messageId)) {
        return {
          ack: createAckEnvelope(envelope.messageId, false, "duplicate command ignored"),
          target: null,
        };
      }

      const sessionId = readSessionId(envelope.payload);
      const route = args.routes.get(sessionId);
      if (!route) {
        throw new RelayProtocolError({
          code: "SESSION_NOT_FOUND",
          statusCode: 404,
          message: "session route is not available on relay",
          details: { sessionId },
        });
      }

      if (
        route.status === "disconnected" &&
        (route.lastStateReason === "local-recovery" ||
          route.lastStateReason === "remote-control-revoked")
      ) {
        throw new RelayProtocolError({
          code: "REMOTE_CONTROL_REVOKED",
          statusCode: 409,
          message: "remote control is no longer active for this session",
          details: {
            sessionId,
            reason: route.lastStateReason,
          },
        });
      }

      const target = args.connections.getLatestByDeviceId(route.ownerDeviceId);
      if (!target) {
        throw new RelayProtocolError({
          code: "SESSION_NOT_FOUND",
          statusCode: 404,
          message: "session owner is not currently connected",
          details: { sessionId, ownerDeviceId: route.ownerDeviceId },
        });
      }

      args.commandDedupe.save({
        deviceId: sourceDeviceId,
        messageId: envelope.messageId,
        recordedAt: envelope.timestamp,
      });

      return {
        ack: createAckEnvelope(envelope.messageId, true, `forwarded to ${route.ownerDeviceId}`),
        target,
      };
    },
  };
}

function buildSessionRouteRecord(args: {
  currentRoute: SessionRouteRecord | null;
  sourceDeviceId: string;
  envelope: ProtocolEventEnvelope;
}): SessionRouteRecord {
  const sessionId = readSessionId(args.envelope.payload);
  const currentRoute = args.currentRoute;
  const baseRecord: SessionRouteRecord = {
    sessionId,
    ownerDeviceId: args.sourceDeviceId,
    provider: currentRoute?.provider,
    status: currentRoute?.status,
    lastStateReason: currentRoute?.lastStateReason,
    currentTask: currentRoute?.currentTask,
    lastActivityAt: currentRoute?.lastActivityAt,
    updatedAt: args.envelope.timestamp,
  };

  if (args.envelope.type === "SessionSummary") {
    return {
      ...baseRecord,
      provider: args.envelope.payload.provider,
      status: args.envelope.payload.status,
      lastStateReason:
        args.envelope.payload.status === "disconnected"
          ? currentRoute?.lastStateReason
          : undefined,
      currentTask: args.envelope.payload.currentTask,
      lastActivityAt: args.envelope.payload.lastActivityAt,
    };
  }

  if (args.envelope.type === "SessionStateChanged") {
    return {
      ...baseRecord,
      status: args.envelope.payload.status,
      lastStateReason: args.envelope.payload.reason,
      lastActivityAt: args.envelope.timestamp,
    };
  }

  if (args.envelope.type === "ApprovalRequested") {
    return {
      ...baseRecord,
      status: "waiting_approval",
      lastStateReason: undefined,
      currentTask: args.envelope.payload.prompt,
      lastActivityAt: args.envelope.payload.issuedAt,
    };
  }

  if (args.envelope.type === "SessionOutputDelta") {
    return {
      ...baseRecord,
      lastActivityAt: args.envelope.timestamp,
    };
  }

  return baseRecord;
}

function toSessionSummaryPayload(route: SessionRouteRecord | null): SessionSummaryPayload | null {
  if (!route || !route.provider || !route.status || !route.lastActivityAt) {
    return null;
  }

  return {
    sessionId: route.sessionId,
    provider: route.provider,
    status: route.status,
    ...(route.currentTask ? { currentTask: route.currentTask } : {}),
    lastActivityAt: route.lastActivityAt,
  };
}

function createSessionSummaryEnvelope(
  payload: SessionSummaryPayload,
): Extract<ProtocolEventEnvelope, { type: "SessionSummary" }> {
  return sessionSummaryEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    messageId: createMessageId("evt"),
    timestamp: payload.lastActivityAt,
    type: "SessionSummary",
    payload,
  });
}
