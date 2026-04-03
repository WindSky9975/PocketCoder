import {
  PROTOCOL_VERSION,
  COMMAND_MESSAGE_TYPE_VALUES,
  EVENT_MESSAGE_TYPE_VALUES,
  createMessageId,
  deviceRegisteredEnvelopeSchema,
  parseProtocolEnvelope,
  type ProtocolCommandEnvelope,
  type ProtocolEnvelope,
  type ProtocolEventEnvelope,
} from "@pocketcoder/protocol";
import type { FastifyInstance } from "fastify";

import { isRelayProtocolError, RelayProtocolError } from "../../infra/protocol-error.js";
import type { SessionRelayService } from "../../modules/sessions/service.js";
import { assertRelayConnectionAllowed } from "../../security/access-control.js";
import { assertValidDeviceProof } from "../../security/device-proof.js";
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

function createDeviceRegisteredEnvelope(args: {
  deviceId: string;
  deviceName: string;
  registeredAt: string;
  publicKey: string;
  pairedDesktopDeviceId: string | null;
  grantedScopes: string[];
}): Extract<ProtocolEventEnvelope, { type: "DeviceRegistered" }> {
  return deviceRegisteredEnvelopeSchema.parse({
    protocolVersion: PROTOCOL_VERSION,
    messageId: createMessageId("evt"),
    timestamp: args.registeredAt,
    type: "DeviceRegistered",
    payload: {
      deviceId: args.deviceId,
      deviceName: args.deviceName,
      registeredAt: args.registeredAt,
      role: "browser",
      publicKey: args.publicKey,
      pairedDesktopDeviceId: args.pairedDesktopDeviceId ?? undefined,
      grantedScopes: args.grantedScopes,
    },
  });
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
    const query = request.query as {
      deviceId?: string;
      role?: string;
      publicKey?: string;
      proof?: string;
      proofTimestamp?: string;
    };
    const deviceId = normalizeHeaderValue(request.headers["x-device-id"]) ?? query.deviceId;
    const role = normalizeDeviceRole(
      normalizeHeaderValue(request.headers["x-device-role"]) ?? query.role,
    );
    const publicKey =
      normalizeHeaderValue(request.headers["x-device-public-key"]) ?? query.publicKey;
    const deviceProof = normalizeHeaderValue(request.headers["x-device-proof"]) ?? query.proof;
    const deviceProofTimestamp =
      normalizeHeaderValue(request.headers["x-device-proof-timestamp"]) ?? query.proofTimestamp;
    const registeredDevice = deviceId ? deps.deviceRegistry.getRegisteredDevice(deviceId) : null;

    if (role === "desktop" && (!deviceId || !publicKey)) {
      sendJson(
        socket,
        createErrorEnvelope("UNAUTHORIZED", "desktop connections must include device identity"),
      );
      socket.close(1008, "unauthorized");
      return;
    }

    try {
      assertValidDeviceProof({
        deviceId,
        role,
        timestamp: deviceProofTimestamp,
        signature: deviceProof,
        publicKey: role === "desktop" ? publicKey : registeredDevice?.publicKey,
      });
    } catch (error) {
      const envelope = isRelayProtocolError(error)
        ? createErrorEnvelope(error.code, error.message, error.details)
        : createErrorEnvelope("UNAUTHORIZED", "device proof was rejected");
      sendJson(socket, envelope);
      socket.close(1008, "unauthorized");
      return;
    }

    if (role === "desktop" && deviceId && publicKey) {
      try {
        deps.deviceRegistry.ensureDesktopDevice({
          deviceId,
          publicKey,
        });
      } catch (error) {
        const envelope = isRelayProtocolError(error)
          ? createErrorEnvelope(error.code, error.message, error.details)
          : createErrorEnvelope("UNAUTHORIZED", "desktop identity was rejected");
        sendJson(socket, envelope);
        socket.close(1008, "unauthorized");
        return;
      }
    }

    const grant = deviceId ? deps.deviceRegistry.getGrant(deviceId) : null;

    try {
      if (role === "browser" && (!registeredDevice || registeredDevice.role !== "browser")) {
        throw new RelayProtocolError({
          code: "UNAUTHORIZED",
          statusCode: 403,
          message: "browser device is not registered for relay access",
          details: { deviceId },
        });
      }

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

    if (activeConnection.role === "desktop") {
      for (const browserDevice of deps.deviceRegistry.listPairedBrowserDevices(activeConnection.deviceId)) {
        sendJson(
          socket,
          createDeviceRegisteredEnvelope({
            deviceId: browserDevice.deviceId,
            deviceName: browserDevice.deviceName,
            registeredAt: browserDevice.pairedAt,
            publicKey: browserDevice.publicKey,
            pairedDesktopDeviceId: browserDevice.pairedDesktopDeviceId,
            grantedScopes: browserDevice.scopes,
          }),
        );
      }
    }

    if (activeConnection.role === "browser" && registeredDevice?.pairedDesktopDeviceId) {
      const desktopConnection = deps.connections.getLatestByDeviceId(
        registeredDevice.pairedDesktopDeviceId,
      );
      if (desktopConnection) {
        deps.connections.send(
          desktopConnection.connectionId,
          JSON.stringify(
            createDeviceRegisteredEnvelope({
              deviceId: registeredDevice.deviceId,
              deviceName: registeredDevice.deviceName,
              registeredAt: registeredDevice.pairedAt,
              publicKey: registeredDevice.publicKey,
              pairedDesktopDeviceId: registeredDevice.pairedDesktopDeviceId,
              grantedScopes: registeredDevice.scopes,
            }),
          ),
        );
      }
    }

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
