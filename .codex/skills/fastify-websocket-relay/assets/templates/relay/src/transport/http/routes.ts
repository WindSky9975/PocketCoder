import type { FastifyInstance } from "fastify";

export async function registerHttpRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/pairing/token/:token", async (request) => {
    const params = request.params as { token: string };

    return {
      token: params.token,
      accepted: true
    };
  });
}