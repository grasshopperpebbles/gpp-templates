export interface QuitDeps {
  servers: { isClosed(): boolean; stopAll(): Promise<void> };
  /** Exits the app for real. */
  exit: () => void;
}

/**
 * The `before-quit` handler: the first quit is held back while both Next servers stop (never
 * Docker), then the app exits. Once that quit has been let through, later quits pass.
 * If the servers were already closed, the quit stays held, because the exit is already under way.
 */
export function createQuitHandler(deps: QuitDeps) {
  let ready = false;
  return (event: { preventDefault(): void }): void => {
    if (ready) return;
    event.preventDefault();
    if (deps.servers.isClosed()) return;
    void deps.servers.stopAll().finally(() => {
      ready = true;
      deps.exit();
    });
  };
}
