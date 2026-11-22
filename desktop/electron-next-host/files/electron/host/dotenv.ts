import { readFileSync } from 'node:fs';

/** Reads KEY=VALUE lines (optional `export`, quotes, trailing ` # comment`). Unknown shapes are skipped. */
export function parseDotEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.indexOf(quote, 1) > 0) {
      value = value.slice(1, value.indexOf(quote, 1));
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    out[key] = value;
  }
  return out;
}

/** The parsed file, or {} when it doesn't exist or can't be read. */
export function readDotEnvFile(file: string): Record<string, string> {
  try {
    return parseDotEnv(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}
