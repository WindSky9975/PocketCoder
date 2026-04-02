import type { SessionStatus } from "@pocketcoder/protocol";

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale, type Messages } from "./messages.ts";

export type ConnectionState = "loading" | "missing_pairing" | "connecting" | "connected" | "error";
export type ApprovalDecision = "allow" | "deny";

export function normalizeLocale(value: string | null | undefined): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

export function getNextLocale(locale: Locale): Locale {
  return locale === "zh-CN" ? "en" : "zh-CN";
}

export function getSessionStatusLabel(
  messages: Messages,
  status: SessionStatus | "disconnected",
): string {
  return messages.statuses.session[status];
}

export function getConnectionStateLabel(messages: Messages, state: ConnectionState): string {
  return messages.statuses.connection[state];
}

export function getDecisionLabel(messages: Messages, decision: ApprovalDecision): string {
  return messages.statuses.decision[decision];
}

export function getStreamLabel(messages: Messages, stream: "stdout" | "stderr"): string {
  return messages.statuses.stream[stream];
}

export function formatLocaleTimestamp(
  locale: Locale,
  messages: Messages,
  value: string | null,
): string {
  if (!value) {
    return messages.common.noActivityYet;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function translateClientError(messages: Messages, errorMessage: string): string {
  const normalized = errorMessage.toLowerCase();
  const statusMatch = errorMessage.match(/status\s+(\d+)/i);

  if (normalized.includes("fetch is not available")) {
    return messages.errors.fetchUnavailable;
  }

  if (normalized.includes("websocket is not available")) {
    return messages.errors.websocketUnavailable;
  }

  if (normalized.includes("browser relay websocket is not connected")) {
    return messages.errors.browserRelayNotConnected;
  }

  if (normalized.includes("relay connection is not ready")) {
    return messages.errors.relayNotReady;
  }

  if (
    normalized.includes("browser failed to connect to relay") ||
    normalized.includes("failed to connect to relay")
  ) {
    return messages.errors.relayConnectFailed;
  }

  if (normalized.includes("relay command failed")) {
    return messages.errors.relayCommandFailed;
  }

  if (normalized.includes("pairing failed with status")) {
    return messages.errors.pairingFailedWithStatus(statusMatch?.[1] ?? "?");
  }

  if (normalized.includes("pairing failed")) {
    return messages.errors.pairingFailed;
  }

  return errorMessage;
}
