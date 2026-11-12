# Node BullMQ worker

TypeScript worker. Jobs are registered in `src/jobs.ts`. BullMQ consumes the `gpp` queue from `REDIS_URL`. `GET /health` on `WORKER_PORT` (3099) lists the registered job names.

The root `docker-compose.yml` starts Redis and this worker. On the host, `REDIS_URL` is `redis://localhost:6379/0`. Inside Compose it is `redis://<project>-redis:6379/0`.

```bash
npm install
npm test
npm run dev
```
