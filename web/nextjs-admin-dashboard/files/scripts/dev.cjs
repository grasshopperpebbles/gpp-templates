const crypto = require("node:crypto");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const PLACEHOLDERS = new Set([
  "your-secret-key-change-in-production",
  "generate-with-openssl-rand-base64-32",
  "replace-with-a-long-random-secret",
  "changeme",
]);

function unquote(value) {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim().replace(/^export\s+/, "");
    if (key) out[key] = trimmed.slice(idx + 1);
  }
  return out;
}

function integerPort(value) {
  const port = Number(unquote(value));
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
}

function localhostPort(value) {
  if (!value) return null;
  try {
    const url = new URL(unquote(value));
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    return integerPort(url.port);
  } catch {
    return null;
  }
}

function upsert(text, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^(?:export\\s+)?${key}=.*$`, "m");
  if (pattern.test(text)) return text.replace(pattern, line);
  const sep = text.length === 0 || text.endsWith("\n") ? "" : "\n";
  return `${text}${sep}${line}\n`;
}

const envFile = path.join(process.cwd(), ".env.local");
const existing = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
const env = parseEnv(existing);

const port =
  integerPort(process.env.PORT) ??
  integerPort(env.PORT) ??
  localhostPort(env.NEXTAUTH_URL) ??
  3000;

function listen(portToTry) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(portToTry, "127.0.0.1", () => {
      server.close(() => resolve());
    });
  });
}

listen(port)
  .catch(() => {
    console.error(`Port ${port} is already in use.`);
    console.error("Set PORT to a free port. NEXTAUTH_URL follows that port.");
    process.exit(1);
  })
  .then(() => {
    let text = existing;
    const secret = unquote(env.NEXTAUTH_SECRET);
    if (!secret || PLACEHOLDERS.has(secret)) {
      text = upsert(text, "NEXTAUTH_SECRET", crypto.randomBytes(32).toString("base64"));
    }
    const url = unquote(env.NEXTAUTH_URL);
    const local = !url || localhostPort(url) != null;
    const nextUrl = `http://localhost:${port}`;
    if (local && url !== nextUrl) {
      text = upsert(text, "NEXTAUTH_URL", nextUrl);
    }
    if (text !== existing) fs.writeFileSync(envFile, text.endsWith("\n") ? text : `${text}\n`);

    const child = spawn("next", ["dev", "--turbopack", "-p", String(port)], {
      stdio: "inherit",
      env: { ...process.env, PORT: String(port), NEXTAUTH_URL: local ? nextUrl : url },
    });
    child.on("exit", (code) => process.exit(code ?? 0));
  });
