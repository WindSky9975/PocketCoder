import type { ProtocolErrorCode } from "@pocketcoder/protocol";

export class RelayProtocolError extends Error {
  readonly code: ProtocolErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(args: {
    code: ProtocolErrorCode;
    statusCode: number;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(args.message);
    this.name = "RelayProtocolError";
    this.code = args.code;
    this.statusCode = args.statusCode;
    this.details = args.details;
  }
}

export function isRelayProtocolError(error: unknown): error is RelayProtocolError {
  return error instanceof RelayProtocolError;
}
