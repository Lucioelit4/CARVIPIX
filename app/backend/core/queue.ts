export type QueueName = "alerts" | "notifications" | "internal" | "heavy" | string;
export type QueueJobStatus = "queued" | "processing" | "completed" | "failed";

export interface QueueJob<TPayload = unknown> {
  id: string;
  queue: QueueName;
  type: string;
  payload: TPayload;
  createdAt: Date;
  scheduledFor?: Date;
  status: QueueJobStatus;
  attempts: number;
  maxRetries: number;
  lastError?: string;
}

export interface QueueEnqueueInput<TPayload = unknown> {
  queue: QueueName;
  type: string;
  payload: TPayload;
  scheduledFor?: Date;
  maxRetries?: number;
}

export interface QueueLayer {
  enqueue<TPayload = unknown>(input: QueueEnqueueInput<TPayload>): QueueJob<TPayload>;
  dequeue(queue: QueueName): QueueJob | null;
  acknowledge(jobId: string): void;
  fail(jobId: string, reason: string): void;
  peek(queue: QueueName): QueueJob[];
}

function createJobId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `job_${Date.now()}_${random}`;
}

export class InMemoryQueueLayer implements QueueLayer {
  private readonly queues = new Map<QueueName, QueueJob[]>();
  private readonly jobsById = new Map<string, QueueJob>();

  constructor(private readonly defaultMaxRetries: number) {}

  enqueue<TPayload = unknown>(input: QueueEnqueueInput<TPayload>): QueueJob<TPayload> {
    const job: QueueJob<TPayload> = {
      id: createJobId(),
      queue: input.queue,
      type: input.type,
      payload: input.payload,
      createdAt: new Date(),
      scheduledFor: input.scheduledFor,
      status: "queued",
      attempts: 0,
      maxRetries: input.maxRetries ?? this.defaultMaxRetries,
    };

    const current = this.queues.get(input.queue) ?? [];
    current.push(job);
    this.queues.set(input.queue, current);
    this.jobsById.set(job.id, job);

    return job;
  }

  dequeue(queue: QueueName): QueueJob | null {
    const current = this.queues.get(queue);
    if (!current || current.length === 0) {
      return null;
    }

    const now = Date.now();
    const index = current.findIndex((job) => {
      if (!job.scheduledFor) {
        return true;
      }

      return job.scheduledFor.getTime() <= now;
    });

    if (index === -1) {
      return null;
    }

    const [job] = current.splice(index, 1);
    job.status = "processing";
    job.attempts += 1;
    this.jobsById.set(job.id, job);
    return job;
  }

  acknowledge(jobId: string): void {
    const job = this.jobsById.get(jobId);
    if (!job) {
      return;
    }

    job.status = "completed";
    this.jobsById.set(jobId, job);
  }

  fail(jobId: string, reason: string): void {
    const job = this.jobsById.get(jobId);
    if (!job) {
      return;
    }

    job.lastError = reason;
    if (job.attempts <= job.maxRetries) {
      job.status = "queued";
      const current = this.queues.get(job.queue) ?? [];
      current.push(job);
      this.queues.set(job.queue, current);
      return;
    }

    job.status = "failed";
    this.jobsById.set(jobId, job);
  }

  peek(queue: QueueName): QueueJob[] {
    const current = this.queues.get(queue) ?? [];
    return current.slice();
  }
}
