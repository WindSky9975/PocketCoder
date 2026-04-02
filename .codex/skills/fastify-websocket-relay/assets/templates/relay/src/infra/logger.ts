import type { FastifyServerOptions } from "fastify";

export function createLoggerOptions(): FastifyServerOptions["logger"] {
  return true;
}