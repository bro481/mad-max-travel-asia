import postgres from "postgres";

type BoundValue = string | number | boolean | null | undefined;
type StoragePutOptions = {
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  client ??= postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    connect_timeout: 8,
    idle_timeout: 20,
  });
  return client;
}

function requireSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET;
  if (!url || !key || !bucket) {
    throw new Error(
      "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_BUCKET are required.",
    );
  }
  let cleanUrl: string;
  try {
    const parsed = new URL(url.trim());
    cleanUrl = parsed.origin;
  } catch {
    throw new Error("SUPABASE_URL must be a valid https://xxx.supabase.co URL.");
  }
  const cleanBucket = bucket.trim().replace(/^\/+|\/+$/g, "");
  if (!cleanBucket || cleanBucket.includes("/") || /^https?:\/\//i.test(cleanBucket)) {
    throw new Error(
      "SUPABASE_BUCKET must be only the bucket name, for example madmax-images.",
    );
  }
  return { url: cleanUrl, key: key.trim(), bucket: cleanBucket };
}

function translatePlaceholders(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function translateSchemaSql(sql: string) {
  return sql
    .replace(
      /\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi,
      "SERIAL PRIMARY KEY",
    )
    .replace(/\bREAL\b/gi, "DOUBLE PRECISION")
    .replace(
      /\bTEXT\s+NOT\s+NULL\s+DEFAULT\s+CURRENT_TIMESTAMP\b/gi,
      "TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::text)",
    )
    .replace(/=\s*CURRENT_TIMESTAMP\b/gi, "=CURRENT_TIMESTAMP::text");
}

function pragmaTableInfo(sql: string) {
  const match = sql.match(/^PRAGMA\s+table_info\(([^)]+)\)/i);
  return match?.[1]?.replace(/["'`]/g, "");
}

async function queryRows(sqlText: string, values: BoundValue[]) {
  const params = values.map((value) => value ?? null);
  const table = pragmaTableInfo(sqlText.trim());
  if (table) {
    return getClient().unsafe(
      "SELECT column_name AS name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
      [table],
    );
  }

  let query = translatePlaceholders(translateSchemaSql(sqlText));
  const isInsert = /^\s*INSERT\b/i.test(query);
  if (isInsert && !/\bRETURNING\b/i.test(query)) query = `${query} RETURNING id`;
  return getClient().unsafe(query, params);
}

function makeStatement(sqlText: string, values: BoundValue[] = []) {
  return {
    bind: (...nextValues: BoundValue[]) => makeStatement(sqlText, nextValues),
    async first<T = Record<string, unknown>>() {
      const rows = await queryRows(sqlText, values);
      return (rows[0] ?? null) as T | null;
    },
    async all<T = Record<string, unknown>>() {
      const rows = await queryRows(sqlText, values);
      return { results: rows as unknown as T[] };
    },
    async run() {
      const rows = await queryRows(sqlText, values);
      const first = rows[0] as { id?: number } | undefined;
      return {
        success: true,
        meta: {
          changes: Number((rows as unknown as { count?: number }).count || 0),
          last_row_id: Number(first?.id || 0),
        },
      };
    },
  };
}

async function storageFetch(path: string, init?: RequestInit) {
  const { url, key, bucket } = requireSupabaseEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(
      `${url}/storage/v1/object/${bucket}/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      {
        ...init,
        signal: controller.signal,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          ...(init?.headers || {}),
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Supabase Storage request timed out after 12 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readStorageError(response: Response) {
  const text = await response.text().catch(() => "");
  return text.replace(/\s+/g, " ").slice(0, 220);
}

export const env = {
  DB: {
    prepare: (sqlText: string) => makeStatement(sqlText),
  },
  IMAGES: {
    async get(key: string) {
      const response = await storageFetch(key);
      if (!response.ok) return null;
      return {
        body: await response.arrayBuffer(),
        httpMetadata: {
          contentType: response.headers.get("content-type") || undefined,
        },
      };
    },
    async put(key: string, body: ArrayBuffer, options?: StoragePutOptions) {
      const response = await storageFetch(key, {
        method: "POST",
        body,
        headers: {
          "Content-Type":
            options?.httpMetadata?.contentType || "application/octet-stream",
          "x-upsert": "true",
        },
      });
      if (!response.ok) {
        const detail = await readStorageError(response);
        throw new Error(
          `Supabase Storage upload failed: ${response.status}${
            detail ? ` ${detail}` : ""
          }`,
        );
      }
      return response;
    },
  },
};
