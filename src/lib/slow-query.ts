// P5.1: Slow query logger.
// Wraps DB operations and logs when they exceed a threshold.
// Does NOT modify the actual query - purely observational.

const SLOW_THRESHOLD_MS = 1000;

export async function logSlowQuery<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    if (duration > SLOW_THRESHOLD_MS) {
      console.warn(
        JSON.stringify({
          type: 'slow_query',
          label,
          durationMs: duration,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }
}
