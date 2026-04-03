import { pairingInitEnvelopeSchema } from "@pocketcoder/protocol";
import type { FastifyInstance } from "fastify";

import { isRelayProtocolError } from "../../infra/protocol-error.js";
import type { PairingModule } from "../../modules/pairing/module.js";
import type { SessionRelayService } from "../../modules/sessions/service.js";
import { assertRelayConnectionAllowed } from "../../security/access-control.js";
import { assertValidDeviceProof } from "../../security/device-proof.js";
import type { DeviceRegistry } from "../../security/device-registry.js";
import type { RelayStorage } from "../../storage/sqlite.js";
import { createErrorEnvelope } from "../protocol-messages.js";
import type { ConnectionRegistry } from "../ws/connection-registry.js";

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function registerHttpRoutes(
  app: FastifyInstance,
  deps: {
    pairing: PairingModule;
    storage: RelayStorage;
    connections: ConnectionRegistry;
    deviceRegistry: DeviceRegistry;
    sessions: SessionRelayService;
  },
): Promise<void> {
  app.get("/health", async () => {
    const storage = await deps.storage.ping();
    const stats = deps.storage.stats();
    const connections = deps.connections.stats();

    return {
      status: "ok",
      storage,
      stats,
      connections,
    };
  });

  app.get("/pairing/token/:token", async (request) => {
    const params = request.params as { token: string };

    return deps.pairing.inspectToken(params.token);
  });

  app.get("/pairing/token", async (request) => {
    const query = request.query as { value?: string };
    return deps.pairing.inspectToken(query.value ?? "");
  });

  app.get("/sessions", async (request, reply) => {
    const query = request.query as { deviceId?: string };
    const deviceId = normalizeHeaderValue(request.headers["x-device-id"]) ?? query.deviceId;
    const deviceProof = normalizeHeaderValue(request.headers["x-device-proof"]);
    const deviceProofTimestamp = normalizeHeaderValue(
      request.headers["x-device-proof-timestamp"],
    );
    const registeredDevice = deviceId ? deps.deviceRegistry.getRegisteredDevice(deviceId) : null;
    const grant = deviceId ? deps.deviceRegistry.getGrant(deviceId) : null;

    try {
      assertValidDeviceProof({
        deviceId,
        role: "browser",
        timestamp: deviceProofTimestamp,
        signature: deviceProof,
        publicKey: registeredDevice?.publicKey,
      });
      assertRelayConnectionAllowed({
        deviceId,
        role: "browser",
        grant,
      });

      if (!registeredDevice || registeredDevice.role !== "browser") {
        reply.code(403);
        return createErrorEnvelope("UNAUTHORIZED", "device is not registered for browser access", {
          deviceId,
        });
      }

      return deps.sessions.listSessionDirectory({
        grant,
        pairedDesktopDeviceId: registeredDevice.pairedDesktopDeviceId,
      });
    } catch (error) {
      if (isRelayProtocolError(error)) {
        reply.code(error.statusCode);
        return createErrorEnvelope(error.code, error.message, error.details);
      }

      reply.code(500);
      return createErrorEnvelope("INTERNAL_ERROR", "session directory lookup failed");
    }
  });

  app.post("/pairing/init", async (request, reply) => {
    const parsed = pairingInitEnvelopeSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      return createErrorEnvelope("INVALID_MESSAGE", "pairing init envelope is invalid", {
        issues: parsed.error.flatten(),
      });
    }

    try {
      const registration = deps.pairing.startPairing(parsed.data.payload);
      reply.code(201);
      return registration;
    } catch (error) {
      if (isRelayProtocolError(error)) {
        reply.code(error.statusCode);
        return createErrorEnvelope(error.code, error.message, error.details);
      }

      reply.code(500);
      return createErrorEnvelope("INTERNAL_ERROR", "pairing bootstrap failed");
    }
  });
}
