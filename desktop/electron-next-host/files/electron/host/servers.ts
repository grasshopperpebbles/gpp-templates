export interface Stoppable {
  stop(): Promise<void>;
}

/**
 * Every Next server the app starts, so quitting can stop them all, including one that is still
 * starting. After stopAll() the registry is closed: a server tracked later is stopped immediately.
 */
export function createServerRegistry() {
  const handles = new Set<Stoppable>();
  let closed = false;
  return {
    track(handle: Stoppable): void {
      handles.add(handle);
      if (closed) void handle.stop().catch(() => undefined);
    },
    isClosed: () => closed,
    async stopAll(): Promise<void> {
      closed = true;
      await Promise.all([...handles].map((h) => h.stop().catch(() => undefined)));
    },
  };
}
