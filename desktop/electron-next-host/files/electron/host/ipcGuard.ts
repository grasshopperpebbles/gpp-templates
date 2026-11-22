/**
 * Wraps an ipcMain.handle handler so it only answers frames whose URL `allow` accepts. Every
 * channel goes through this, so the check can't be forgotten on one of them.
 */
export function guarded<Args extends unknown[], R>(
  allow: (url: string | undefined) => boolean,
  handler: (event: { senderFrame?: { url?: string } | null }, ...args: Args) => R,
) {
  return (event: { senderFrame?: { url?: string } | null }, ...args: Args): R => {
    if (!allow(event.senderFrame?.url)) throw new Error('Untrusted sender');
    return handler(event, ...args);
  };
}
