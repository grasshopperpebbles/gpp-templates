/** The address to pass to `listen`, or undefined so development keeps every interface. */
export function bindHost(host: string | undefined): string | undefined {
  const trimmed = host?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * CORS `origin` for this process. Development allows every origin. Production uses the
 * configured list. A missing list is empty, never `*`.
 */
export function corsOrigin(nodeEnv: string | undefined, raw: string | undefined): '*' | string[] {
  if (nodeEnv !== 'production') return '*';
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
