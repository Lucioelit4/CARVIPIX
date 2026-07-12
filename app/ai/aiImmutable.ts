export function shallowReadonlyClone<T extends object>(value: T): T {
  return Object.freeze({ ...value }) as T;
}
