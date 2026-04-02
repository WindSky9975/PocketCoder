import websocket from "@fastify/websocket";
import Fastify from "fastify";

import { createLoggerOptions } from "./infra/logger.js";
import { registerHttpRoutes } from "./transport/http/routes.js";
import { registerWsRoutes } from "./transport/ws/routes.js";

export async function buildApp() {
  const app = Fastify({ logger: createLoggerOptions() });

  await app.register(websocket);
  await registerHttpRoutes(app);
  await registerWsRoutes(app);

  return app;
}