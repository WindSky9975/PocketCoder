import type {
  ApprovalRequestedPayload,
  EncryptedPayload,
  SessionOutputDeltaPayload,
  SessionSummaryPayload,
} from "@pocketcoder/protocol";

import { decryptBrowserPayload } from "../crypto/session-crypto.ts";
import type { StoredPairedDevice } from "../storage/device-store.ts";

export async function readSessionSummaryPayload(args: {
  message: {
    messageId: string;
    payload: SessionSummaryPayload;
  };
  pairedDevice: StoredPairedDevice;
}): Promise<SessionSummaryPayload> {
  if (!args.message.payload.encrypted) {
    return args.message.payload;
  }

  const decrypted = await decryptBrowserPayload<{ currentTask?: string }>({
    remotePublicKey: args.pairedDevice.desktopPublicKey,
    type: "SessionSummary",
    messageId: args.message.messageId,
    sessionId: args.message.payload.sessionId,
    encrypted: args.message.payload.encrypted as EncryptedPayload,
  });

  return {
    ...args.message.payload,
    ...decrypted,
  };
}

export async function readSessionOutputDeltaPayload(args: {
  message: {
    messageId: string;
    payload: SessionOutputDeltaPayload;
  };
  pairedDevice: StoredPairedDevice;
}): Promise<SessionOutputDeltaPayload> {
  if (!args.message.payload.encrypted) {
    return args.message.payload;
  }

  const decrypted = await decryptBrowserPayload<{ delta: string }>({
    remotePublicKey: args.pairedDevice.desktopPublicKey,
    type: "SessionOutputDelta",
    messageId: args.message.messageId,
    sessionId: args.message.payload.sessionId,
    encrypted: args.message.payload.encrypted as EncryptedPayload,
  });

  return {
    ...args.message.payload,
    ...decrypted,
  };
}

export async function readApprovalRequestedPayload(args: {
  message: {
    messageId: string;
    payload: ApprovalRequestedPayload;
  };
  pairedDevice: StoredPairedDevice;
}): Promise<ApprovalRequestedPayload> {
  if (!args.message.payload.encrypted) {
    return args.message.payload;
  }

  const decrypted = await decryptBrowserPayload<{
    approvalId: string;
    prompt: string;
  }>({
    remotePublicKey: args.pairedDevice.desktopPublicKey,
    type: "ApprovalRequested",
    messageId: args.message.messageId,
    sessionId: args.message.payload.sessionId,
    encrypted: args.message.payload.encrypted as EncryptedPayload,
  });

  return {
    ...args.message.payload,
    ...decrypted,
  };
}
