import type { AIQueueResult, AIQueueTask } from "./types";

type QueueTaskRunner<T> = () => Promise<T>;

export class AIEvaluationQueue {
  private readonly inFlight = new Map<string, Promise<AIQueueResult<unknown>>>();
  private readonly completed = new Map<string, AIQueueResult<unknown>>();

  async enqueue<T>(task: AIQueueTask, runner: QueueTaskRunner<T>): Promise<AIQueueResult<T>> {
    const key = task.dedupeKey;

    const alreadyCompleted = this.completed.get(key);
    if (alreadyCompleted) {
      return alreadyCompleted as AIQueueResult<T>;
    }

    const existing = this.inFlight.get(key);
    if (existing) {
      return (await existing) as AIQueueResult<T>;
    }

    const wrapped = (async () => {
      const value = await runner();
      const result: AIQueueResult<T> = {
        dedupeKey: key,
        value,
        createdAtUtc: new Date().toISOString(),
      };
      this.completed.set(key, result as AIQueueResult<unknown>);
      this.inFlight.delete(key);
      return result;
    })();

    this.inFlight.set(key, wrapped as Promise<AIQueueResult<unknown>>);
    return (await wrapped) as AIQueueResult<T>;
  }

  hasCompleted(dedupeKey: string): boolean {
    return this.completed.has(dedupeKey);
  }

  clear(): void {
    this.inFlight.clear();
    this.completed.clear();
  }
}
