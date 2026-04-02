import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fetchRelaySessionDirectory } from "../../lib/realtime/session-directory.ts";

describe("relay session directory client", () => {
  it("requests the relay session directory with the paired browser device id", async () => {
    const requests: Array<{ url: string; headers: HeadersInit | undefined }> = [];

    const sessions = await fetchRelaySessionDirectory({
      relayOrigin: "http://relay.test",
      deviceId: "browser-1",
      fetchImpl: async (input, init) => {
        requests.push({
          url: String(input),
          headers: init?.headers,
        });

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              sessions: [
                {
                  sessionId: "session-1",
                  provider: "codex",
                  status: "running",
                  currentTask: "inspect relay logs",
                  lastActivityAt: "2026-04-02T10:00:00.000Z",
                },
              ],
            };
          },
        } as Response;
      },
    });

    assert.equal(requests[0]?.url, "http://relay.test/sessions");
    assert.deepEqual(requests[0]?.headers, {
      "x-device-id": "browser-1",
    });
    assert.equal(sessions[0]?.sessionId, "session-1");
  });

  it("surfaces relay error messages when the directory request is rejected", async () => {
    await assert.rejects(
      () =>
        fetchRelaySessionDirectory({
          relayOrigin: "http://relay.test",
          deviceId: "browser-1",
          fetchImpl: async () =>
            ({
              ok: false,
              status: 403,
              async json() {
                return {
                  type: "ErrorEnvelope",
                  payload: {
                    message: "device is not registered for relay access",
                  },
                };
              },
            }) as Response,
        }),
      /device is not registered for relay access/,
    );
  });
});
