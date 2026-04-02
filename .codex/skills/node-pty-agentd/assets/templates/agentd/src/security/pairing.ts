export interface PairingTokenResult {
  token: string;
}

export function issuePairingToken(): PairingTokenResult {
  return {
    token: "pairing-token-placeholder"
  };
}