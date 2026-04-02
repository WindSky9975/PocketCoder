import { pairingInitEnvelopeSchema } from "@pocketcoder/protocol";
import type { FastifyInstance } from "fastify";

import { isRelayProtocolError } from "../../infra/protocol-error.js";
import type { PairingModule } from "../../modules/pairing/module.js";
import type { RelayStorage } from "../../storage/sqlite.js";
import { createErrorEnvelope } from "../protocol-messages.js";
import type { ConnectionRegistry } from "../ws/connection-registry.js";

export async function registerHttpRoutes(
  app: FastifyInstance,
  deps: {
    pairing: PairingModule;
    storage: RelayStorage;
    connections: ConnectionRegistry;
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
