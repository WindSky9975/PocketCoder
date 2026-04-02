import websocket from "@fastify/websocket";
import Fastify from "fastify";

import { readRelayConfig, type RelayConfig } from "./infra/config.js";
import { createLoggerOptions } from "./infra/logger.js";
import { createPairingModule } from "./modules/pairing/module.js";
import { createReplayService } from "./modules/replay/service.js";
import { createSessionRelayService } from "./modules/sessions/service.js";
import { createDeviceRegistry } from "./security/device-registry.js";
import { createRelayStorage } from "./storage/sqlite.js";
import { registerHttpCors } from "./transport/http/cors.js";
import { registerHttpRoutes } from "./transport/http/routes.js";
import { createConnectionRegistry } from "./transport/ws/connection-registry.js";
import { registerWsRoutes } from "./transport/ws/routes.js";

export async function buildApp(config: RelayConfig = readRelayConfig()) {
  const app = Fastify({ logger: createLoggerOptions() });
  const storage = createRelayStorage();
  const connections = createConnectionRegistry();
  const deviceRegistry = createDeviceRegistry(storage.devices);
  const pairing = createPairingModule({
    pairingRecords: storage.pairingRecords,
    deviceRegistry,
    relayOrigin: config.publicOrigin,
  });
  const replay = createReplayService(storage.replayEvents, config.replayWindowMs);
  const sessions = createSessionRelayService({
    routes: storage.sessionRoutes,
    commandDedupe: storage.commandReceipts,
    replay,
    connections,
  });

  await app.register(websocket);
  await registerHttpCors(app);
  await registerHttpRoutes(app, { pairing, storage, connections, deviceRegistry, sessions });
  await registerWsRoutes(app, { connections, deviceRegistry, sessions });

  return app;
}
