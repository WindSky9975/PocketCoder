export interface PairingTokenRecord {
  token: string;
  expiresAt: string;
}

export function isPairingTokenShape(token: string): boolean {
  return token.trim().length > 0;
}