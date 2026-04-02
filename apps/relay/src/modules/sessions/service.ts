import type { ProtocolCommandEnvelope, ProtocolEventEnvelope } from "@pocketcoder/protocol";

import { RelayProtocolError } from "../../infra/protocol-error.js";
import { assertSessionScope } from "../../security/access-control.js";
import type { DeviceGrant } from "../../security/device-registry.js";
import type { CommandDedupeRepository } from "../../storage/repositories/command-dedupe-repository.js";
import type { SessionRouteRepository } from "../../storage/repositories/session-route-repository.js";
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
      args.routes.save({
        sessionId,
        ownerDeviceId: sourceDeviceId,
        updatedAt: envelope.timestamp,
      });

      args.replay.record(envelope);

      for (const subscriber of args.connections.listSubscribers(sessionId)) {
        if (subscriber.connectionId === sourceConnectionId) {
          continue;
        }

        args.connections.send(subscriber.connectionId, JSON.stringify(envelope));
      }
    },
    handleSessionSubscribe(connectionId, grant, envelope) {
      assertSessionScope(grant, "session:read");

      const sessionId = readSessionId(envelope.payload);
      args.connections.subscribe(connectionId, sessionId);

      return {
        ack: createAckEnvelope(envelope.messageId, true, `subscribed to ${sessionId}`),
        replay: args.replay.listRecent(sessionId),
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
