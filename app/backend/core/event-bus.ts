export interface ServiceEvent<TPayload = unknown> {
  type: string;
  payload: TPayload;
  occurredAt: Date;
}

type ServiceEventHandler<TPayload = unknown> = (event: ServiceEvent<TPayload>) => void;

export class InMemoryServiceEventBus {
  private readonly handlers = new Map<string, Set<ServiceEventHandler>>();

  subscribe<TPayload = unknown>(eventType: string, handler: ServiceEventHandler<TPayload>): () => void {
    const current = this.handlers.get(eventType) ?? new Set<ServiceEventHandler>();
    current.add(handler as ServiceEventHandler);
    this.handlers.set(eventType, current);

    return () => {
      const set = this.handlers.get(eventType);
      if (!set) {
        return;
      }

      set.delete(handler as ServiceEventHandler);
      if (set.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }

  publish<TPayload = unknown>(eventType: string, payload: TPayload): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const event: ServiceEvent<TPayload> = {
      type: eventType,
      payload,
      occurredAt: new Date(),
    };

    handlers.forEach((handler) => {
      handler(event);
    });
  }
}
