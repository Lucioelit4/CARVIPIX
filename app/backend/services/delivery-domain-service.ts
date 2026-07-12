import type {
  IDeliveryDomainService,
  ServiceDeliveryJob,
  ServiceDeliveryReference,
} from "../contracts";
import type { QueueLayer } from "../core/queue";
import { masterSignalStore } from "@/app/ai/cadpV2/masterSignalStore";

function toDeliveryJob(job: {
  id: string;
  queue: string;
  type: string;
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
  payload: unknown;
}): ServiceDeliveryJob {
  const payload = (job.payload ?? {}) as { reference?: ServiceDeliveryReference };
  const reference = payload.reference ?? {
    signalId: "",
    analysisId: "",
    signalVersion: "",
  };

  return {
    id: job.id,
    queue: job.queue,
    type: job.type,
    status: job.status,
    attempts: job.attempts,
    maxRetries: job.maxRetries,
    lastError: job.lastError,
    createdAt: job.createdAt,
    reference,
  };
}

export class DeliveryDomainService implements IDeliveryDomainService {
  private readonly dedupe = new Set<string>();

  constructor(private readonly queueLayer: QueueLayer) {}

  async enqueueFromLatestSignal(signalVersion: string): Promise<ServiceDeliveryJob | null> {
    const latest = masterSignalStore.getLatest();
    if (!latest) {
      return null;
    }

    return this.enqueueReference({
      signalId: latest.signal_id,
      analysisId: latest.analysis_id,
      signalVersion,
    });
  }

  async enqueueReference(reference: ServiceDeliveryReference): Promise<ServiceDeliveryJob> {
    const key = `${reference.signalId}:${reference.analysisId}:${reference.signalVersion}`;
    if (this.dedupe.has(key)) {
      const existing = this.queueLayer
        .peek("alerts")
        .find((job) => {
          const payload = (job.payload ?? {}) as { reference?: ServiceDeliveryReference };
          return payload.reference?.signalId === reference.signalId
            && payload.reference?.analysisId === reference.analysisId
            && payload.reference?.signalVersion === reference.signalVersion;
        });
      if (existing) {
        return toDeliveryJob(existing as ServiceDeliveryJob & { payload: unknown });
      }
    }

    this.dedupe.add(key);

    const job = this.queueLayer.enqueue({
      queue: "alerts",
      type: "master-signal-delivery",
      payload: { reference },
    });

    return toDeliveryJob(job as ServiceDeliveryJob & { payload: unknown });
  }

  async peek(limit = 50): Promise<ServiceDeliveryJob[]> {
    return this.queueLayer
      .peek("alerts")
      .slice(0, Math.max(1, Math.min(limit, 500)))
      .map((job) => toDeliveryJob(job as ServiceDeliveryJob & { payload: unknown }));
  }

  async processNext(): Promise<ServiceDeliveryJob | null> {
    const job = this.queueLayer.dequeue("alerts");
    if (!job) {
      return null;
    }

    const payload = (job.payload ?? {}) as { reference?: ServiceDeliveryReference };
    const hasReference = Boolean(payload.reference?.signalId && payload.reference?.analysisId && payload.reference?.signalVersion);

    if (!hasReference) {
      this.queueLayer.fail(job.id, "INVALID_DELIVERY_REFERENCE");
      return toDeliveryJob({ ...job, status: "failed" } as ServiceDeliveryJob & { payload: unknown });
    }

    this.queueLayer.acknowledge(job.id);
    return toDeliveryJob({ ...job, status: "completed" } as ServiceDeliveryJob & { payload: unknown });
  }
}
