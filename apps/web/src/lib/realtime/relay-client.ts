import { PROTOCOL_VERSION, createMessageId, parseProtocolEnvelope } from "@pocketcoder/protocol";

interface BrowserWebSocketMessageEvent {
  data: unknown;
}

interface BrowserWebSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(
    type: "open" | "close" | "error" | "message",
    listener: (event: Event | BrowserWebSocketMessageEvent) => void,
    options?: { once?: boolean },
  ): void;
}

interface BrowserWebSocketConstructor {
  new (url: string): BrowserWebSocket;
}

export type RelayInboundMessage =
  | {
      type: "connected";
      deviceId: string;
      role: string;
    }
  | ReturnType<typeof parseProtocolEnvelope>;

export type RelayTransportState = "connected" | "disconnected" | "error";

export interface BrowserRelayClient {
  connect(): Promise<void>;
  subscribe(sessionId: string): Promise<void>;
  sendPrompt(sessionId: string, prompt: string): Promise<void>;
  respondToApproval(sessionId: string, approvalId: string, decision: "allow" | "deny"): Promise<void>;
  interruptSession(sessionId: string, reason?: string): Promise<void>;
  resumeDesktopControl(sessionId: string): Promise<void>;
  disconnect(): Promise<void>;
}

export function resolveRelayWebSocketUrl(relayOrigin: string): string {
  const relayUrl = new URL("/ws", relayOrigin);
  relayUrl.protocol = relayUrl.protocol === "https:" ? "wss:" : "ws:";
  return relayUrl.toString();
}

export function createBrowserRelayClient(args: {
  relayUrl: string;
  deviceId: string;
  onMessage?: (message: RelayInboundMessage) => void;
  onTransportStateChange?: (state: RelayTransportState) => void;
}): BrowserRelayClient {
  const WebSocketConstructor = globalThis.WebSocket as unknown as BrowserWebSocketConstructor | undefined;
  let socket: BrowserWebSocket | null = null;
  let manualClose = false;

  function ensureSocket(): BrowserWebSocket {
    if (!socket || socket.readyState !== 1) {
      throw new Error("browser relay websocket is not connected");
    }

    return socket;
  }

  function sendEnvelope(payload: Record<string, unknown>): Promise<void> {
    ensureSocket().send(JSON.stringify(payload));
    return Promise.resolve();
  }

  return {
    async connect() {
      if (!WebSocketConstructor) {
        throw new Error("WebSocket is not available in this runtime");
      }

      if (socket?.readyState === 1) {
        return;
      }

      const relayUrl = new URL(args.relayUrl);
      relayUrl.searchParams.set("deviceId", args.deviceId);
      relayUrl.searchParams.set("role", "browser");

      manualClose = false;
      socket = new WebSocketConstructor(relayUrl.toString());
      socket.addEventListener("close", () => {
        const wasManualClose = manualClose;
        socket = null;
        if (!wasManualClose) {
          args.onTransportStateChange?.("disconnected");
        }
      });
      socket.addEventListener("error", () => {
        args.onTransportStateChange?.("error");
      });
      socket.addEventListener("message", (event) => {
        const raw = JSON.parse(String((event as BrowserWebSocketMessageEvent).data)) as unknown;
        if (
          typeof raw === "object" &&
          raw !== null &&
          "type" in raw &&
          raw.type === "connected"
        ) {
          args.onMessage?.(raw as RelayInboundMessage);
          return;
        }

        args.onMessage?.(parseProtocolEnvelope(raw));
      });

      await new Promise<void>((resolve, reject) => {
        socket?.addEventListener(
          "open",
          () => {
            args.onTransportStateChange?.("connected");
            resolve();
          },
          { once: true },
        );
        socket?.addEventListener(
          "error",
          () => reject(new Error("browser failed to connect to relay")),
          { once: true },
        );
      });
    },
    async subscribe(sessionId) {
      await sendEnvelope({
        protocolVersion: PROTOCOL_VERSION,
        messageId: createMessageId("cmd"),
        timestamp: new Date().toISOString(),
        type: "SessionSubscribe",
        payload: {
          sessionId,
        },
      });
    },
    async sendPrompt(sessionId, prompt) {
      await sendEnvelope({
        protocolVersion: PROTOCOL_VERSION,
        messageId: createMessageId("cmd"),
        timestamp: new Date().toISOString(),
        type: "SendPrompt",
        payload: {
          sessionId,
          prompt,
        },
      });
    },
    async respondToApproval(sessionId, approvalId, decision) {
      await sendEnvelope({
        protocolVersion: PROTOCOL_VERSION,
        messageId: createMessageId("cmd"),
        timestamp: new Date().toISOString(),
        type: "ApprovalResponse",
        payload: {
          sessionId,
          approvalId,
          decision,
        },
      });
    },
    async interruptSession(sessionId, reason) {
      await sendEnvelope({
        protocolVersion: PROTOCOL_VERSION,
        messageId: createMessageId("cmd"),
        timestamp: new Date().toISOString(),
        type: "InterruptSession",
        payload: {
          sessionId,
          reason,
        },
      });
    },
    async resumeDesktopControl(sessionId) {
      await sendEnvelope({
        protocolVersion: PROTOCOL_VERSION,
        messageId: createMessageId("cmd"),
        timestamp: new Date().toISOString(),
        type: "ResumeDesktopControl",
        payload: {
          sessionId,
          requestedBy: args.deviceId,
        },
      });
    },
    async disconnect() {
      manualClose = true;
      socket?.close(1000, "browser shutdown");
      socket = null;
    },
  };
}
