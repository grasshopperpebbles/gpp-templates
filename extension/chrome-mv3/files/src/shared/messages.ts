/**
 * Message types exchanged between the popup, content scripts and the service worker,
 * plus the checks the service worker runs before acting on one. Pure (no chrome.* calls)
 * so it can be unit tested.
 */

export type ExtensionMessage =
  | { type: 'GET_STATUS' }
  | { type: 'TOGGLE_ENABLED' }
  | { type: 'DATA_CAPTURED'; payload: unknown };

const MESSAGE_TYPES = new Set<string>(['GET_STATUS', 'TOGGLE_ENABLED', 'DATA_CAPTURED']);

/** Messages that change settings; only the extension's own pages (the popup) may send them. */
const PAGE_ONLY_TYPES = new Set<string>(['TOGGLE_ENABLED']);

/** Returns the message when it has a known `type`, otherwise null. */
export function parseMessage(message: unknown): ExtensionMessage | null {
  if (typeof message !== 'object' || message === null) return null;
  const type = (message as { type?: unknown }).type;
  if (typeof type !== 'string' || !MESSAGE_TYPES.has(type)) return null;
  return message as ExtensionMessage;
}

/** The parts of chrome.runtime.MessageSender the checks use. */
export interface SenderInfo {
  id?: string;
  tab?: unknown;
}

/**
 * True when `sender` is this extension (`extensionId` is chrome.runtime.id) and, for
 * settings changes, an extension page rather than a content script running in a web page.
 */
export function isAllowedSender(
  message: ExtensionMessage,
  sender: SenderInfo,
  extensionId: string
): boolean {
  if (sender.id !== extensionId) return false;
  if (PAGE_ONLY_TYPES.has(message.type) && sender.tab !== undefined) return false;
  return true;
}
