import type { RelayClient } from "./relay-client.js";

export interface AgentdEventPublisher {
  publish(event: Record<string, unknown>): Promise<void>;
}

export function createEventPublisher(relayClient: RelayClient): AgentdEventPublisher {
  return {
    async publish(event) {
      await relayClient.publish(event);
    }
  };
}