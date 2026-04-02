export interface PairingStartInput {
  token: string;
  candidatePublicKey: string;
}

export function buildPairingStartPayload(input: PairingStartInput): PairingStartInput {
  return {
    token: input.token.trim(),
    candidatePublicKey: input.candidatePublicKey.trim(),
  };
}