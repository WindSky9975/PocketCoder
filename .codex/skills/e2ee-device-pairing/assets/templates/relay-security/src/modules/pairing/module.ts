export interface PairingExchangeRequest {
  token: string;
  candidatePublicKey: string;
}

export function normalizePairingExchange(request: PairingExchangeRequest): PairingExchangeRequest {
  return {
    token: request.token.trim(),
    candidatePublicKey: request.candidatePublicKey.trim(),
  };
}