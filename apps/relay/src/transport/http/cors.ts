import type { FastifyInstance } from "fastify";

const ACCESS_CONTROL_ALLOW_HEADERS = [
  "content-type",
  "x-device-id",
  "x-device-proof",
  "x-device-proof-timestamp",
  "x-device-role",
  "x-device-public-key",
].join(", ");

const ACCESS_CONTROL_ALLOW_METHODS = ["GET", "POST", "OPTIONS"].join(", ");

function resolveOriginHeader(origin: string | string[] | undefined): string | null {
  if (Array.isArray(origin)) {
    return origin[0] ?? null;
  }

  return typeof origin === "string" && origin.length > 0 ? origin : null;
}

export async function registerHttpCors(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request, reply) => {
    const origin = resolveOriginHeader(request.headers.origin);

    if (origin) {
      reply.header("access-control-allow-origin", origin);
      reply.header("vary", "Origin");
    }

    reply.header("access-control-allow-methods", ACCESS_CONTROL_ALLOW_METHODS);
    reply.header("access-control-allow-headers", ACCESS_CONTROL_ALLOW_HEADERS);

    if (request.method === "OPTIONS") {
      reply.code(204);
      await reply.send();
    }
  });
}
