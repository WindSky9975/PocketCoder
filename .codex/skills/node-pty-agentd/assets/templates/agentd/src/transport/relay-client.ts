import type { AgentdOutboundEvent } from "./event-publisher.js";

export interface RelayClient {
  connect(): Promise<void>;
  publish(message: AgentdOutboundEvent): Promise<void>;
  disconnect(): Promise<void>;
}

export function createRelayClient(relayUrl: string): RelayClient {
  return {
    async connect() {
      console.log("[agentd] connect relay", { relayUrl });
    },
    async publish(message) {
      console.log("[agentd] publish relay event", message);
    },
    async disconnect() {
      console.log("[agentd] disconnect relay");
    }
  };
}
