import websocket from "@fastify/websocket";
import Fastify from "fastify";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(websocket);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}