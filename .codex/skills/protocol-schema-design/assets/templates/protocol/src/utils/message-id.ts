export function createMessageId(prefix = "msg"): string {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  const suffix = randomUUID
    ? randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return `${prefix}_${suffix}`;
}

export function normalizeMessageId(messageId: string): string {
  return messageId.trim();
}