import ical, { type DateWithTimeZone, type EventInstance, type ParameterValue, type VEvent } from "node-ical";
import { addDays, startOfDay } from "@/lib/time";
import type { CalendarEvent } from "./types";

// ICS-Text → Termine im Zeitfenster. Rein (ohne Netzwerk), damit mit echten ICS-Formen testbar.
// node-ical übernimmt Wiederholungen (RRULE), Ausnahmen (EXDATE), verschobene Einzeltermine
// (RECURRENCE-ID) und Zeitzonen inklusive Zeitumstellung.

const MAX_TITLE = 160;
const MAX_LOCATION = 120;
/** Obergrenze, damit der Cache-Eintrag klein bleibt (Next.js speichert höchstens 2 MB pro Eintrag). */
export const MAX_EVENTS = 3000;

export type DayRange = { from: string; to: string }; // Kalendertage inklusive

export class IcsParseError extends Error {
  constructor() {
    super("ics_parse_failed"); // bewusst ohne Originalmeldung: die kann Termininhalte enthalten
    this.name = "IcsParseError";
  }
}

function clean(value: ParameterValue | undefined, max: number, firstLineOnly = false): string {
  const raw = typeof value === "string" ? value : (value?.val ?? "");
  const text = firstLineOnly ? String(raw).split(/\r?\n/)[0] : String(raw);
  const single = text.replace(/\s+/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}

/**
 * Ganztägige Werte legt node-ical auf 00:00 in der Zeitzone des Servers. Der Kalendertag ergibt sich daher
 * aus den lokalen Datumsteilen (in Tests über mehrere Server-Zeitzonen geprüft).
 */
function localDay(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function toEvent(inst: EventInstance, base: VEvent, prefix: string, timeZone: string): CalendarEvent | null {
  const source = inst.event ?? base;
  if (source.status === "CANCELLED") return null;
  const start: DateWithTimeZone = inst.start;
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null;
  const end = inst.end instanceof Date && !Number.isNaN(inst.end.getTime()) ? inst.end : start;

  let startMs: number;
  let endMs: number;
  if (inst.isFullDay) {
    const firstDay = localDay(start);
    const endDay = localDay(end);
    startMs = startOfDay(firstDay, timeZone);
    endMs = startOfDay(endDay > firstDay ? endDay : addDays(firstDay, 1), timeZone);
  } else {
    startMs = start.getTime();
    endMs = Math.max(end.getTime(), startMs);
  }

  const location = clean(source.location as ParameterValue | undefined, MAX_LOCATION, true);
  return {
    id: `${prefix}:${base.uid}:${startMs}`,
    title: clean(inst.summary ?? source.summary, MAX_TITLE) || "Untitled",
    location: location || null,
    allDay: inst.isFullDay,
    start: startMs,
    end: endMs,
  };
}

export function byStart(a: CalendarEvent, b: CalendarEvent): number {
  return a.start - b.start || Number(b.allDay) - Number(a.allDay) || a.end - b.end || a.title.localeCompare(b.title);
}

/** Alle Termine, die den Zeitraum berühren, sortiert nach Beginn. `prefix` hält IDs mehrerer Kalender eindeutig. */
export function eventsFromIcs(ics: string, range: DayRange, timeZone: string, prefix = "c0"): CalendarEvent[] {
  let data: ReturnType<typeof ical.sync.parseICS>;
  try {
    data = ical.sync.parseICS(ics);
  } catch {
    throw new IcsParseError();
  }

  const fromMs = startOfDay(range.from, timeZone);
  const toMs = startOfDay(addDays(range.to, 1), timeZone); // exklusiv
  const out: CalendarEvent[] = [];

  for (const component of Object.values(data)) {
    if (!component || component.type !== "VEVENT") continue;
    const event = component as VEvent;
    if (!(event.start instanceof Date)) continue;
    // Schneller Ausschluss alter Einzeltermine (iCloud liefert die komplette Historie).
    if (!event.rrule && event.end instanceof Date && event.end.getTime() < fromMs - 86_400_000) continue;

    let instances: EventInstance[];
    try {
      instances = ical.expandRecurringEvent(event, { from: new Date(fromMs), to: new Date(toMs), expandOngoing: true });
    } catch {
      continue; // ein kaputter Termin darf nicht den ganzen Kalender verhindern
    }
    for (const inst of instances) {
      const e = toEvent(inst, event, prefix, timeZone);
      if (!e) continue;
      const touches = e.end > e.start ? e.start < toMs && e.end > fromMs : e.start >= fromMs && e.start < toMs;
      if (touches) out.push(e);
    }
  }

  return out.sort(byStart).slice(0, MAX_EVENTS);
}
