type LocalImportSession = {
  code: string;
  propertyId?: number | null;
  images: string[];
  expiresAt: string;
  completedAt: string | null;
};

type LocalMedia = {
  body: ArrayBuffer;
  contentType: string;
};

const globalStore = globalThis as typeof globalThis & {
  __madMaxLocalImportSessions?: Map<string, LocalImportSession>;
  __madMaxLocalImportMedia?: Map<string, LocalMedia>;
};

const sessions = globalStore.__madMaxLocalImportSessions ?? new Map<string, LocalImportSession>();
const media = globalStore.__madMaxLocalImportMedia ?? new Map<string, LocalMedia>();
globalStore.__madMaxLocalImportSessions = sessions;
globalStore.__madMaxLocalImportMedia = media;

export function useLocalImageImport() {
  return process.env.NODE_ENV === "development";
}

export function createLocalImportSession(propertyId?: number | null) {
  let code = "";
  do {
    code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map((value) => (value % 10).toString())
      .join("");
  } while (sessions.has(code));

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  sessions.set(code, { code, propertyId, images: [], expiresAt, completedAt: null });
  return { code, expiresAt };
}

export function getLocalImportSession(code: string | null) {
  if (!code) return null;
  return sessions.get(code) || null;
}

export async function addLocalImportFiles(code: string, files: File[], complete: boolean) {
  const session = sessions.get(code);
  if (!session) return null;
  if (session.completedAt || new Date(session.expiresAt) < new Date()) return "expired" as const;
  if (!files.length || session.images.length + files.length > 50) return "invalid" as const;

  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) continue;
    const suffix = file.type.includes("png")
      ? "png"
      : file.type.includes("webp")
        ? "webp"
        : file.type.includes("avif")
          ? "avif"
          : "jpg";
    const key = `local-import/${crypto.randomUUID()}.${suffix}`;
    media.set(key, { body: await file.arrayBuffer(), contentType: file.type });
    urls.push(`/api/media/${key}`);
  }
  session.images = [...session.images, ...urls];
  session.completedAt = complete ? new Date().toISOString() : null;
  sessions.set(code, session);
  return { uploaded: urls.length, total: session.images.length, completed: complete };
}

export function getLocalMedia(key: string) {
  return media.get(key) || null;
}
