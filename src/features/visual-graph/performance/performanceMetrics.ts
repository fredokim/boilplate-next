export function measureOperation<T>(name: string, operation: () => T): { value: T; durationMs: number } {
  const start = performance.now(); const value = operation(); const durationMs = performance.now() - start;
  if (process.env.NODE_ENV !== "production") performance.measure(name, { start, duration: durationMs });
  return { value, durationMs };
}
