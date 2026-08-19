declare module "cloudflare:workers" {
  type Statement = {
    bind: (...values: unknown[]) => Statement;
    first: <T = unknown>() => Promise<T | null>;
    all: <T = unknown>() => Promise<{ results: T[] }>;
    run: () => Promise<{
      meta: {
        last_row_id?: number;
        changes?: number;
      };
    }>;
  };

  export const env: {
    DB: {
      prepare: (query: string) => Statement;
    };
    IMAGES: {
      get: (...args: unknown[]) => Promise<{
        body: BodyInit | null;
        httpMetadata?: {
          contentType?: string;
        };
      } | null>;
      put: (...args: unknown[]) => Promise<unknown>;
    };
  };
}
