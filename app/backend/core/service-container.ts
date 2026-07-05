export class ServiceContainer {
  private readonly registry = new Map<string, unknown>();

  register<TService>(token: string, instance: TService): void {
    this.registry.set(token, instance);
  }

  resolve<TService>(token: string): TService {
    const service = this.registry.get(token);
    if (!service) {
      throw new Error(`Service token not found: ${token}`);
    }

    return service as TService;
  }
}
