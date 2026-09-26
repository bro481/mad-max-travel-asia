export async function withPublicDataTimeout<T>(
  promise: Promise<T>,
  fallback: T | (() => T),
  label: string,
  timeoutMs = Number(process.env.PUBLIC_DATA_TIMEOUT_MS || 1200),
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fallbackValue = () => (typeof fallback === "function" ? (fallback as () => T)() : fallback);
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`${label} timed out after ${timeoutMs}ms; using static fallback.`);
      resolve(fallbackValue());
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    console.error(`${label} failed; using static fallback.`, error);
    return fallbackValue();
  } finally {
    if (timer) clearTimeout(timer);
  }
}
