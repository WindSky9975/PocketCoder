import type { FastifyInstance } from "fastify";

import { assertRelayConnectionAllowed } from "../../security/access-control.js";

export async function registerWsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/ws", { websocket: true }, async (connection, request) => {
    const deviceId = request.headers["x-device-id"];
    const normalizedDeviceId = Array.isArray(deviceId) ? deviceId[0] : deviceId;

    assertRelayConnectionAllowed({ deviceId: normalizedDeviceId });

    connection.socket.send(
      JSON.stringify({
        type: "connected",
        deviceId: normalizedDeviceId
      })
    );
  });
}