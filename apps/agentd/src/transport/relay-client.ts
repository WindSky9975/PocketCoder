import {
  COMMAND_MESSAGE_TYPE_VALUES,
  parseProtocolEnvelope,
  type ProtocolCommandEnvelope,
  type ProtocolEventEnvelope,
} from "@pocketcoder/protocol";

interface RelayWebSocketMessageEvent {
  data: unknown;
}

interface RelayWebSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(
    type: "open" | "close" | "error" | "message",
    listener: (event: Event | RelayWebSocketMessageEvent) => void,
    options?: { once?: boolean },
  ): void;
}

interface RelayWebSocketConstructor {
  new (url: string): RelayWebSocket;
}

export interface RelayClient {
  connect(): Promise<void>;
  publish(message: ProtocolEventEnvelope): Promise<void>;
  disconnect(): Promise<void>;
}

export function createRelayClient(args: {
  relayUrl: string;
  deviceId: string;
  onCommand: (command: ProtocolCommandEnvelope) => Promise<void>;
}): RelayClient {
  const WebSocketConstructor = globalThis.WebSocket as unknown as RelayWebSocketConstructor | undefined;
  let socket: RelayWebSocket | null = null;

  function ensureSocket(): RelayWebSocket {
    if (!socket || socket.readyState !== 1) {
      throw new Error("relay websocket is not connected");
    }

    return socket;
  }

  return {
    async connect() {
      if (!WebSocketConstructor) {
        throw new Error("global WebSocket is not available in this runtime");
      }

      if (socket?.readyState === 1) {
        return;
      }

      const relayUrl = new URL(args.relayUrl);
      relayUrl.searchParams.set("deviceId", args.deviceId);
      relayUrl.searchParams.set("role", "desktop");

      socket = new WebSocketConstructor(relayUrl.toString());
      socket.addEventListener("message", async (event) => {
        try {
          const message = JSON.parse(String((event as RelayWebSocketMessageEvent).data)) as unknown;
          if (
            typeof message === "object" &&
            message !== null &&
            "type" in message &&
            message.type === "connected"
          ) {
            return;
          }

          const envelope = parseProtocolEnvelope(message);
          if ((COMMAND_MESSAGE_TYPE_VALUES as readonly string[]).includes(envelope.type)) {
            await args.onCommand(envelope as ProtocolCommandEnvelope);
          }
        } catch {
          return;
        }
      });

      await new Promise<void>((resolve, reject) => {
        socket?.addEventListener("open", () => resolve(), { once: true });
        socket?.addEventListener(
          "error",
          () => reject(new Error("agentd failed to connect to relay")),
          { once: true },
        );
      });
    },
    async publish(message) {
      ensureSocket().send(JSON.stringify(message));
    },
    async disconnect() {
      socket?.close(1000, "agentd shutdown");
      socket = null;
    },
  };
}
