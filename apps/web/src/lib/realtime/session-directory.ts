import { sessionDirectoryResponseSchema, type SessionSummaryPayload } from "@pocketcoder/protocol";

export async function fetchRelaySessionDirectory(args: {
  relayOrigin: string;
  deviceId: string;
  fetchImpl?: typeof fetch;
}): Promise<SessionSummaryPayload[]> {
  const fetchImpl = args.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("fetch is not available in this runtime");
  }

  const response = await fetchImpl(new URL("/sessions", args.relayOrigin), {
    headers: {
      "x-device-id": args.deviceId,
    },
  });
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "payload" in payload &&
      typeof payload.payload === "object" &&
      payload.payload !== null &&
      "message" in payload.payload &&
      typeof payload.payload.message === "string"
    ) {
      throw new Error(payload.payload.message);
    }

    throw new Error(`relay command failed with status ${response.status}`);
  }

  return sessionDirectoryResponseSchema.parse(payload).sessions;
}
