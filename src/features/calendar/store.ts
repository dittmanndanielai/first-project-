import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { TAGS, TTL } from "@/lib/cache-tags";
import { env } from "@/lib/env";
import { log, logError } from "@/lib/log";
import { addDays, isoDate } from "@/lib/time";
import { demoEvents } from "@/mocks/calendar";
import { byStart, eventsFromIcs, MAX_EVENTS } from "./ics";
import { calendarUrls, CalendarFetchError, fetchIcs } from "./source";
import type { CalendarData, CalendarResult } from "./types";

// Nur lesend. Abruf nur, wenn die App genutzt wird (kein Cron, kein n8n).
//
// Cache: das kleine, geparste Ergebnis liegt im persistenten Next.js-Data-Cache (unstable_cache, Tag „calendar“),
// nicht die rohe ICS-Antwort. Gründe: iCloud liefert die ganze Historie (kann > 2 MB sein, dann würde Next.js
// den Link ins Log schreiben), und das Parsen fällt so nur einmal pro 5 Minuten an.
// Der Schlüssel enthält das 5-Minuten-Fenster: nach einer Pause sieht man nie stundenalte Termine.
// Manueller Refresh: updateTag(TAGS.calendar) in actions.ts.

/** Geladener Zeitraum rund um heute. */
export const PAST_DAYS = 14;
export const FUTURE_DAYS = 90;

async function loadIcloud(today: string): Promise<CalendarData> {
  const e = env();
  const { urls } = calendarUrls(e.ICLOUD_CALENDAR_URL);
  const range = { from: addDays(today, -PAST_DAYS), to: addDays(today, FUTURE_DAYS) };
  const started = Date.now();

  const results = await Promise.allSettled(
    urls.map(async (url, i) => eventsFromIcs(await fetchIcs(url), range, e.APP_TIMEZONE, `c${i}`)),
  );
  let failed = 0;
  const events = results.flatMap((r, i) => {
    if (r.status === "fulfilled") return r.value;
    failed++;
    logError("calendar.fetch", r.reason, { calendar: i });
    return [];
  });
  if (failed === urls.length) throw new CalendarFetchError("all_failed"); // nicht cachen, nächster Aufruf versucht es neu

  events.sort(byStart);
  log("calendar.loaded", { calendars: urls.length, failed, events: events.length, ms: Date.now() - started });
  return { events: events.slice(0, MAX_EVENTS), fetchedAt: Date.now(), ...range, failed };
}

// Argumente bilden den Cache-Schlüssel: Tag (Fenster wandert mit) und 5-Minuten-Fenster. Der Link selbst ist
// bewusst kein Argument und steht damit nicht im Schlüssel.
const cachedIcloud = unstable_cache(
  async (today: string, window: number) => {
    void window; // nur Teil des Schlüssels
    return loadIcloud(today);
  },
  ["calendar-icloud-v1"],
  { revalidate: TTL.calendar, tags: [TAGS.calendar] },
);

// Nach einem Fehlschlag 60 s lang nicht erneut versuchen (pro Server-Instanz). Sonst wartet bei einem hängenden
// iCloud jeder Seitenaufruf erneut bis zum Timeout, und Next.js rendert /calendar je Request zweimal.
// Der manuelle Refresh hebt die Sperre auf.
const RETRY_AFTER_MS = 60_000;
let failedAt = 0;

export function clearCalendarFailure() {
  failedAt = 0;
}

/** Termine von PAST_DAYS vor bis FUTURE_DAYS nach heute. Pro Request nur einmal geladen; wirft nie. */
export const getCalendar = cache(async (): Promise<CalendarResult> => {
  const e = env();
  const now = Date.now();
  const today = isoDate(new Date(now), e.APP_TIMEZONE);
  const { urls, invalid } = calendarUrls(e.ICLOUD_CALENDAR_URL);

  if (urls.length === 0) {
    if (invalid > 0) {
      log("calendar.config_invalid", { entries: invalid });
      return { status: "invalid_config" };
    }
    if (e.DATA_SOURCE === "mock") {
      return {
        status: "ok",
        source: "demo",
        events: demoEvents(today, e.APP_TIMEZONE),
        fetchedAt: now,
        from: addDays(today, -PAST_DAYS),
        to: addDays(today, FUTURE_DAYS),
        failed: 0,
      };
    }
    return { status: "not_configured" };
  }

  if (now - failedAt < RETRY_AFTER_MS) return { status: "error" };
  try {
    const data = await cachedIcloud(today, Math.floor(now / (TTL.calendar * 1000)));
    return { status: "ok", source: "icloud", ...data };
  } catch (err) {
    failedAt = Date.now();
    logError("calendar.load", err);
    return { status: "error" };
  }
});
