import http from "node:http";
import { Worker } from "bullmq";
import { registry } from "./jobs";

const port = Number(process.env.WORKER_PORT || 3099);
const redisUrl = process.env.REDIS_URL;

function redisConnection(urlString: string) {
  const url = new URL(urlString);
  const db = Number(url.pathname.replace(/^\//, "") || 0);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: Number.isFinite(db) ? db : 0,
    maxRetriesPerRequest: null,
  };
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, jobs: registry.names() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

let worker: Worker | undefined;

async function main(): Promise<void> {
  await new Promise<void>((resolve) => {
    server.listen(port, () => resolve());
  });
  console.log(`health http://127.0.0.1:${port}/health`);
  if (!redisUrl) {
    console.log("REDIS_URL is unset; not consuming jobs");
    return;
  }
  worker = new Worker(
    "gpp",
    async (job) => {
      await registry.dispatch(job.name, job.data);
    },
    { connection: redisConnection(redisUrl) },
  );
  console.log(`consuming queue gpp from ${redisUrl}`);
}

function shutdown(): void {
  const closeServer = new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  Promise.all([worker?.close(), closeServer]).finally(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
