export class SafeModePolicy {
  constructor(private readonly safeModeEnabled: boolean) {}

  shouldBlockExecution(executionRequested?: boolean): boolean {
    return Boolean(executionRequested && this.safeModeEnabled);
  }

  isEnabled(): boolean {
    return this.safeModeEnabled;
  }
}