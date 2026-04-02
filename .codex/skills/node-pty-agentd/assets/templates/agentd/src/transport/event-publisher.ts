import type { RelayClient } from "./relay-client.js";

export interface AgentdOutboundEvent {
  type: string;
  payload: Record<string, unknown>;
}

export interface AgentdEventPublisher {
  publish(event: AgentdOutboundEvent): Promise<void>;
}

export function createEventPublisher(relayClient: RelayClient): AgentdEventPublisher {
  return {
    async publish(event) {
      await relayClient.publish(event);
    }
  };
}
