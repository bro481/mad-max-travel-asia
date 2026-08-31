export class AdminDataError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
  ) {
    super(message);
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchAdminData<T>(url: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload as T;
      const message = String(payload?.error || `服务器返回 ${response.status}`);
      if (response.status === 401) throw new AdminDataError(message, 401);
      if (![502, 503, 504].includes(response.status) || attempt === 2)
        throw new AdminDataError(message, response.status);
      lastError = new AdminDataError(message, response.status);
    } catch (error) {
      if (error instanceof AdminDataError && error.status === 401) throw error;
      lastError = error;
      if (attempt === 2) break;
    }
    await wait(500 * (attempt + 1));
  }
  if (lastError instanceof AdminDataError) throw lastError;
  if (lastError instanceof DOMException && lastError.name === "TimeoutError")
    throw new AdminDataError("房源数据库连接超时，请稍后重试。", 504);
  throw new AdminDataError("房源后台暂时无法连接，请稍后重试。", 503);
}
