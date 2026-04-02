import {
  COMMAND_MESSAGE_TYPE_VALUES,
  EVENT_MESSAGE_TYPE_VALUES,
  parseProtocolEnvelope,
  type ProtocolCommandEnvelope,
  type ProtocolEnvelope,
  type ProtocolEventEnvelope,
} from "@pocketcoder/protocol";
import type { FastifyInstance } from "fastify";

import { isRelayProtocolError } from "../../infra/protocol-error.js";
import type { SessionRelayService } from "../../modules/sessions/service.js";
import { assertRelayConnectionAllowed } from "../../security/access-control.js";
import type { DeviceRegistry } from "../../security/device-registry.js";
import type { RelayDeviceRole } from "../../storage/repositories/device-record-repository.js";
import { createErrorEnvelope } from "../protocol-messages.js";
import type { ConnectionRegistry } from "./connection-registry.js";

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeDeviceRole(value: string | undefined): RelayDeviceRole {
  return value === "desktop" ? "desktop" : "browser";
}

function sendJson(socket: { send(data: string): void }, payload: unknown): void {
  socket.send(JSON.stringify(payload));
}

function isCommandEnvelope(envelope: ProtocolEnvelope): envelope is ProtocolCommandEnvelope {
  return (COMMAND_MESSAGE_TYPE_VALUES as readonly string[]).includes(envelope.type);
}

function isEventEnvelope(envelope: ProtocolEnvelope): envelope is ProtocolEventEnvelope {
  return (EVENT_MESSAGE_TYPE_VALUES as readonly string[]).includes(envelope.type);
}

export async function registerWsRoutes(
  app: FastifyInstance,
  deps: {
    connections: ConnectionRegistry;
    deviceRegistry: DeviceRegistry;
    sessions: SessionRelayService;
  },
): Promise<void> {
  app.get("/ws", { websocket: true }, async (socket, request) => {
    const query = request.query as { deviceId?: string; role?: string };
    const deviceId = normalizeHeaderValue(request.headers["x-device-id"]) ?? query.deviceId;
    const role = normalizeDeviceRole(
      normalizeHeaderValue(request.headers["x-device-role"]) ?? query.role,
    );
    const grant = deviceId ? deps.deviceRegistry.getGrant(deviceId) : null;

    try {
      assertRelayConnectionAllowed({ deviceId, role, grant });
    } catch (error) {
      const envelope = isRelayProtocolError(error)
        ? createErrorEnvelope(error.code, error.message, error.details)
        : createErrorEnvelope("UNAUTHORIZED", "relay connection was rejected");
      sendJson(socket, envelope);
      socket.close(1008, "unauthorized");
      return;
    }

    const activeConnection = deps.connections.register({
      deviceId: deviceId ?? "unknown-device",
      role,
      socket,
    });

    sendJson(socket, {
      type: "connected",
      deviceId: activeConnection.deviceId,
      role: activeConnection.role,
    });

    socket.on("message", (chunk: Buffer) => {
      deps.connections.touch(activeConnection.connectionId);

      try {
        const raw = JSON.parse(chunk.toString("utf8")) as unknown;
        const envelope = parseProtocolEnvelope(raw);

        if (isCommandEnvelope(envelope)) {
          if (activeConnection.role !== "browser") {
            throw createErrorEnvelope("UNAUTHORIZED", "desktop connections cannot issue relay commands");
          }

          if (envelope.type === "PairingInit" || envelope.type === "PairingConfirm") {
            throw createErrorEnvelope(
              "INVALID_MESSAGE",
              "pairing commands must use the HTTP pairing entrypoint",
            );
          }

          if (envelope.type === "SessionSubscribe") {
            const result = deps.sessions.handleSessionSubscribe(
              activeConnection.connectionId,
              grant,
              envelope,
            );
            sendJson(socket, result.ack);
            for (const replayEnvelope of result.replay) {
              sendJson(socket, replayEnvelope);
            }
            return;
          }

          const result = deps.sessions.handleControlCommand(activeConnection.deviceId, grant, envelope);
          if (result.target) {
            deps.connections.send(result.target.connectionId, JSON.stringify(envelope));
          }
          sendJson(socket, result.ack);
          return;
        }

        if (isEventEnvelope(envelope)) {
          if (activeConnection.role !== "desktop") {
            throw createErrorEnvelope("UNAUTHORIZED", "browser connections cannot publish relay events");
          }

          deps.sessions.handleRealtimeEvent(
            activeConnection.connectionId,
            activeConnection.deviceId,
            envelope,
          );
          return;
        }
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "type" in error &&
          error.type === "ErrorEnvelope"
        ) {
          sendJson(socket, error);
          return;
        }

        if (isRelayProtocolError(error)) {
          sendJson(socket, createErrorEnvelope(error.code, error.message, error.details));
          return;
        }

        sendJson(socket, createErrorEnvelope("INVALID_MESSAGE", "relay rejected websocket payload"));
      }
    });

    socket.on("close", () => {
      deps.connections.unregister(activeConnection.connectionId);
    });
  });
}
