export type SchedulerTaskCategory = "maintenance" | "cleanup" | "sync" | "scheduled";

export interface SchedulerTaskContext {
  taskId: string;
  runAt: Date;
}

export interface SchedulerTaskDefinition {
  id: string;
  name: string;
  category: SchedulerTaskCategory;
  intervalMs: number;
  enabled?: boolean;
  run: (context: SchedulerTaskContext) => Promise<void>;
}

export interface ScheduledTaskSnapshot {
  id: string;
  name: string;
  category: SchedulerTaskCategory;
  intervalMs: number;
  enabled: boolean;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastError?: string;
}

export interface Scheduler {
  register(task: SchedulerTaskDefinition): void;
  unregister(taskId: string): void;
  list(): ScheduledTaskSnapshot[];
  runDueTasks(now?: Date): Promise<void>;
}

type InternalTask = SchedulerTaskDefinition & {
  enabled: boolean;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastError?: string;
};

export class InMemoryScheduler implements Scheduler {
  private readonly tasks = new Map<string, InternalTask>();

  constructor(private readonly maxTasks: number) {}

  register(task: SchedulerTaskDefinition): void {
    if (!this.tasks.has(task.id) && this.tasks.size >= this.maxTasks) {
      throw new Error(`Scheduler max tasks reached (${this.maxTasks})`);
    }

    const enabled = task.enabled ?? true;
    const nextRunAt = new Date(Date.now() + task.intervalMs);

    this.tasks.set(task.id, {
      ...task,
      enabled,
      nextRunAt,
    });
  }

  unregister(taskId: string): void {
    this.tasks.delete(taskId);
  }

  list(): ScheduledTaskSnapshot[] {
    return Array.from(this.tasks.values()).map((task) => ({
      id: task.id,
      name: task.name,
      category: task.category,
      intervalMs: task.intervalMs,
      enabled: task.enabled,
      nextRunAt: task.nextRunAt,
      lastRunAt: task.lastRunAt,
      lastError: task.lastError,
    }));
  }

  async runDueTasks(now = new Date()): Promise<void> {
    const runAtMs = now.getTime();

    for (const task of this.tasks.values()) {
      if (!task.enabled) {
        continue;
      }

      if (task.nextRunAt.getTime() > runAtMs) {
        continue;
      }

      try {
        await task.run({
          taskId: task.id,
          runAt: now,
        });
        task.lastRunAt = now;
        task.lastError = undefined;
      } catch (error) {
        task.lastRunAt = now;
        task.lastError = error instanceof Error ? error.message : "Unknown scheduler task error";
      } finally {
        task.nextRunAt = new Date(runAtMs + task.intervalMs);
      }
    }
  }
}
