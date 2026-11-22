import { createServer } from 'node:net';

/**
 * Every address a dev server could be listening on. On macOS a bind to 127.0.0.1 succeeds while
 * another process holds the wildcard (`next dev` listens on `::`), so one probe isn't enough:
 * the port is free only when we can listen on all of these. `undefined` is the default host,
 * the dual-stack `::`.
 */
const PROBE_HOSTS: Array<string | undefined> = [undefined, '0.0.0.0', '127.0.0.1', '::1'];

/** The machine has no such address (for example no IPv6): nothing can be listening there. */
const ABSENT = new Set(['EADDRNOTAVAIL', 'EAFNOSUPPORT']);

function canListen(port: number, host: string | undefined): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (error: NodeJS.ErrnoException) => resolve(ABSENT.has(error.code ?? '')));
    const onListening = () => server.close(() => resolve(true));
    if (host === undefined) server.listen(port, onListening);
    else server.listen(port, host, onListening);
  });
}

/** True when nothing is listening on `port` on any local address. */
export async function isPortFree(port: number): Promise<boolean> {
  for (const host of PROBE_HOSTS) {
    if (!(await canListen(port, host))) return false;
  }
  return true;
}
