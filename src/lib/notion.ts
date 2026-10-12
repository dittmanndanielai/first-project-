import "server-only";
import { env } from "./env";
import type { CacheTag } from "./cache-tags";

// Dünner Notion-Client auf Basis von fetch (kein SDK nötig).
// Lesen: fetch-Cache mit Tags (persistiert auf Vercel über Requests hinweg).
// Schreiben: immer no-store.

const API = "https://api.notion.com/v1/";
const VERSION = "2025-09-03"; // gleiche Version wie die n8n-Workflows
const TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;

export class NotionError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "NotionError";
  }
}

type ReadCache = { revalidate: number; tags: CacheTag[] };

type Options = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Lesezugriffe geben einen Cache an, Schreibzugriffe nicht. */
  cache?: ReadCache;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryDelayMs(res: Response | null, attempt: number): number {
  const retryAfter = res?.headers.get("retry-after");
  if (retryAfter && !Number.isNaN(Number(retryAfter))) return Number(retryAfter) * 1000;
  return 400 * 2 ** attempt + Math.floor(Math.random() * 200);
}

export async function notion<T>(path: string, opts: Options = {}): Promise<T> {
  const token = env().NOTION_TOKEN;
  if (!token) throw new NotionError(500, "not_configured", "NOTION_TOKEN fehlt");

  const init: RequestInit & { next?: { revalidate: number; tags: string[] } } = {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  };
  if (opts.cache) {
    init.cache = "force-cache";
    init.next = { revalidate: opts.cache.revalidate, tags: opts.cache.tags };
  } else {
    init.cache = "no-store";
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(API + path, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return (await res.json()) as T;

      const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      const err = new NotionError(res.status, data.code ?? "unknown", data.message ?? res.statusText);
      // 429 (Rate Limit), 529 (überlastet) und 5xx wiederholen, alles andere sofort melden.
      if (res.status !== 429 && res.status < 500) throw err;
      lastError = err;
    } catch (e) {
      if (e instanceof NotionError && e.status !== 429 && e.status < 500) throw e;
      lastError = e;
    }
    if (attempt < MAX_ATTEMPTS - 1) await sleep(retryDelayMs(res, attempt));
  }
  throw lastError instanceof Error ? lastError : new NotionError(503, "unavailable", "Notion nicht erreichbar");
}
