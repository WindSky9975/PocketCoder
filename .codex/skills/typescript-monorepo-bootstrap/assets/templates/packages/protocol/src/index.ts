export const PROTOCOL_VERSION = "0.1.0";

export type PairingState = "pending" | "approved" | "rejected";

export interface ProtocolEnvelope<TPayload = unknown> {
  type: string;
  payload: TPayload;
  version: string;
}