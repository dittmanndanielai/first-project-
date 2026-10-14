import "server-only";

// Abruf des öffentlichen iCloud-Kalenders. Der Link ist ein Geheimnis (wer ihn hat, liest den Kalender):
// Er kommt nur aus ICLOUD_CALENDAR_URL, steht nie in Fehlermeldungen oder Logs und wird nur an
// *.icloud.com geschickt, auch bei Weiterleitungen.

const TIMEOUT_MS = 8000;
/** iCloud liefert die komplette Historie; 5 MB reichen für viele Jahre und schützen vor Ausreißern. */
export const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const MAX_URLS = 5;

/** Fehler mit festem Code. Die Meldung enthält nie den Link. */
export class CalendarFetchError extends Error {
  constructor(public code: string) {
    super(`calendar_${code}`);
    this.name = "CalendarFetchError";
  }
}

function allowed(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    (url.port === "" || url.port === "443") &&
    (url.hostname === "icloud.com" || /^[a-z0-9-]+\.icloud\.com$/.test(url.hostname))
  );
}

/**
 * Liest ICLOUD_CALENDAR_URL: ein Link oder mehrere durch Komma getrennt (ein Link pro freigegebenem Kalender).
 * webcal:// wird zu https://. Alles außer iCloud wird verworfen und nur gezählt.
 */
export function calendarUrls(raw: string | undefined): { urls: URL[]; invalid: number } {
  const entries = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const urls: URL[] = [];
  let invalid = 0;
  for (const entry of entries.slice(0, MAX_URLS)) {
    try {
      const url = new URL(entry.replace(/^webcals?:\/\//i, "https://"));
      if (allowed(url)) urls.push(url);
      else invalid++;
    } catch {
      invalid++;
    }
  }
  return { urls, invalid: invalid + Math.max(0, entries.length - MAX_URLS) };
}

async function readLimited(res: Response, maxBytes: number): Promise<string> {
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > maxBytes) {
    await res.body?.cancel().catch(() => {});
    throw new CalendarFetchError("too_large");
  }
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new CalendarFetchError("too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8").decode(bytes);
}

function isTimeout(err: unknown): boolean {
  return err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
}

/** Lädt den ICS-Text, ohne Next.js-Cache (gecacht wird das kleine, geparste Ergebnis in store.ts). */
export async function fetchIcs(url: URL, opts: { timeoutMs?: number; maxBytes?: number } = {}): Promise<string> {
  if (!allowed(url)) throw new CalendarFetchError("url_not_allowed");
  const signal = AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS); // gilt für alle Weiterleitungen und den Body
  let current = url;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(current, {
        cache: "no-store",
        redirect: "manual",
        signal,
        headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.5" },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        await res.body?.cancel().catch(() => {});
        if (!location) throw new CalendarFetchError("redirect_without_location");
        const next = new URL(location, current);
        if (!allowed(next)) throw new CalendarFetchError("redirect_not_allowed");
        current = next;
        continue;
      }
      if (!res.ok) {
        await res.body?.cancel().catch(() => {});
        throw new CalendarFetchError(`http_${res.status}`);
      }

      const text = await readLimited(res, opts.maxBytes ?? MAX_BYTES);
      if (!text.includes("BEGIN:VCALENDAR")) throw new CalendarFetchError("not_ics");
      return text;
    }
    throw new CalendarFetchError("too_many_redirects");
  } catch (err) {
    if (err instanceof CalendarFetchError) throw err;
    // Netzwerkfehler von undici nennen teils Host und Pfad, daher nur ein Code.
    throw new CalendarFetchError(isTimeout(err) ? "timeout" : "network");
  }
}
