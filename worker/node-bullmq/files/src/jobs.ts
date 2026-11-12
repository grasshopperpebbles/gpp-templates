export type JobHandler<T> = (data: T) => Promise<void>;

export interface JobDefinition<T> {
  name: string;
  handle: JobHandler<T>;
}

/** In-process registry. BullMQ dispatches a job name into `dispatch`. */
export class JobRegistry {
  private readonly jobs = new Map<string, JobDefinition<unknown>>();

  register<T>(job: JobDefinition<T>): void {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job already registered: ${job.name}`);
    }
    this.jobs.set(job.name, job as JobDefinition<unknown>);
  }

  names(): string[] {
    return [...this.jobs.keys()].sort();
  }

  async dispatch(name: string, data: unknown): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) throw new Error(`Unknown job: ${name}`);
    await job.handle(data);
  }
}

export const registry = new JobRegistry();

registry.register<{ at: string }>({
  name: "ping",
  async handle(data) {
    console.log(`ping ${data.at}`);
  },
});
