/** True only for http://localhost:<port>/… , the origin the desktop's web server answers on. */
export function isPageUrl(url: string | undefined, port: number): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' && parsed.hostname === 'localhost' && parsed.port === String(port);
}
