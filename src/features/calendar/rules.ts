import { addDays, isIsoDate, isoDate, shortDayLabel, startOfDay, timeLabel, weekStart } from "@/lib/time";
import type { CalendarEvent } from "./types";

// Reine Anzeige-Regeln für Today, Calendar und den Sprachassistenten. Alle Zeiten in der App-Zeitzone.

const MINUTE = 60_000;

/** Termine ohne Dauer zählen eine Minute, damit „läuft gerade“ und „auf diesem Tag“ eindeutig sind. */
export const endOf = (e: CalendarEvent) => (e.end > e.start ? e.end : e.start + MINUTE);

/** Kalendertag (YYYY-MM-DD) eines Zeitpunkts. */
export function dayOf(ms: number, timeZone: string): string {
  return isoDate(new Date(ms), timeZone);
}

/** Termine, die den Kalendertag berühren (mehrtägige an jedem ihrer Tage). */
export function eventsOnDay(events: CalendarEvent[], day: string, timeZone: string): CalendarEvent[] {
  const from = startOfDay(day, timeZone);
  const to = startOfDay(addDays(day, 1), timeZone);
  return events.filter((e) => e.start < to && endOf(e) > from);
}

export type Upcoming = {
  /** Nächster Termin mit Uhrzeit, der noch nicht vorbei ist (läuft er schon, ist `ongoing` true). */
  next: CalendarEvent | null;
  ongoing: boolean;
  /** Bis zu `more` weitere Termine mit Uhrzeit danach. */
  later: CalendarEvent[];
  /** Ganztägige Termine von heute (Geburtstag, Urlaub). */
  allDayToday: CalendarEvent[];
};

export function upcoming(events: CalendarEvent[], now: number, today: string, timeZone: string, more = 3): Upcoming {
  const timed = events.filter((e) => !e.allDay && endOf(e) > now);
  const next = timed[0] ?? null;
  return {
    next,
    ongoing: next !== null && next.start <= now,
    later: timed.slice(1, 1 + more),
    allDayToday: eventsOnDay(events, today, timeZone).filter((e) => e.allDay),
  };
}

export function relativeLabel(minutes: number): string {
  if (minutes < 1) return "now";
  if (minutes < 60) return `in ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `in ${h} h ${m} min` : `in ${h} h`;
}

/** "Today", "Tomorrow", sonst z. B. "Thu 16 Oct". */
export function dayLabel(day: string, today: string): string {
  if (day === today) return "Today";
  if (day === addDays(today, 1)) return "Tomorrow";
  if (day === addDays(today, -1)) return "Yesterday";
  return shortDayLabel(day);
}

/** Kopfzeile des nächsten Termins: "Now · until 10:30", "in 36 min", "Tomorrow". */
export function nextLabel(next: CalendarEvent, now: number, today: string, timeZone: string): string {
  if (next.start <= now) return `Now · until ${timeLabel(next.end, timeZone)}`;
  const day = dayOf(next.start, timeZone);
  if (day !== today) return dayLabel(day, today);
  return relativeLabel(Math.ceil((next.start - now) / MINUTE));
}

/** Uhrzeit eines Termins an einem bestimmten Tag: "09:00 – 09:30", "from 22:00", "until 02:00", "All day". */
export function timeRangeOn(e: CalendarEvent, day: string, timeZone: string): string {
  if (e.allDay) return "All day";
  const from = startOfDay(day, timeZone);
  const to = startOfDay(addDays(day, 1), timeZone);
  const s = e.start >= from ? timeLabel(e.start, timeZone) : null;
  const en = e.end <= to ? timeLabel(e.end, timeZone) : null;
  if (s && en) return s === en ? s : `${s} – ${en}`;
  if (s) return `from ${s}`;
  if (en) return `until ${en}`;
  return "All day";
}

/** Kurzform für Listen: "09:00" (heute), "Tomorrow · 09:00", "Thu 16 Oct · 09:00". */
export function whenLabel(e: CalendarEvent, today: string, timeZone: string): string {
  const day = dayOf(e.start, timeZone);
  const prefix = day === today ? "" : dayLabel(day, today);
  if (e.allDay) return prefix || "All day";
  return prefix ? `${prefix} · ${timeLabel(e.start, timeZone)}` : timeLabel(e.start, timeZone);
}

// ---------- Kalenderseite: Ansicht und Navigation ----------

export type CalendarView = "day" | "week";

export type ViewState = {
  view: CalendarView;
  /** Gewählter Tag (Tagesansicht) bzw. ein Tag der Woche (Wochenansicht). */
  date: string;
  /** Angezeigte Tage: einer oder sieben (Montag bis Sonntag). */
  days: string[];
  /** Ziel für zurück/vor; null außerhalb des geladenen Zeitraums. */
  prev: string | null;
  next: string | null;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Liest ?view=day|week&date=YYYY-MM-DD robust; ungültige Werte fallen auf Woche und heute zurück. */
export function viewState(
  params: { view?: string | string[]; date?: string | string[] },
  today: string,
  range: { from: string; to: string },
): ViewState {
  const view: CalendarView = first(params.view) === "day" ? "day" : "week";
  const raw = first(params.date) ?? "";
  let date = isIsoDate(raw) ? raw : today;
  if (date < range.from) date = range.from;
  if (date > range.to) date = range.to;

  if (view === "day") {
    const prev = addDays(date, -1);
    const next = addDays(date, 1);
    return { view, date, days: [date], prev: prev >= range.from ? prev : null, next: next <= range.to ? next : null };
  }
  const monday = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const prevSunday = addDays(monday, -1);
  const nextMonday = addDays(monday, 7);
  return {
    view,
    date,
    days,
    prev: prevSunday >= range.from ? addDays(monday, -7) : null,
    next: nextMonday <= range.to ? nextMonday : null,
  };
}

/** Überschrift der Wochenansicht: "12 – 18 Oct 2026" oder "26 Oct – 1 Nov 2026". */
export function weekTitle(days: string[]): string {
  const [y1, m1, d1] = days[0].split("-").map(Number);
  const [y2, m2, d2] = days[days.length - 1].split("-").map(Number);
  const month = (y: number, m: number) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" }).format(new Date(Date.UTC(y, m - 1, 15)));
  if (y1 !== y2) return `${d1} ${month(y1, m1)} ${y1} – ${d2} ${month(y2, m2)} ${y2}`;
  if (m1 !== m2) return `${d1} ${month(y1, m1)} – ${d2} ${month(y2, m2)} ${y2}`;
  return `${d1} – ${d2} ${month(y2, m2)} ${y2}`;
}

/** Link auf die Kalenderseite. */
export function calendarHref(view: CalendarView, date: string): string {
  return `/calendar?view=${view}&date=${date}`;
}

// ---------- Sprachassistent (vorbereitet, noch ohne Endpunkt) ----------

export type VoiceAgenda = {
  date: string;
  events: { time: string; title: string; location: string | null }[];
};

/**
 * Kompakte, sprechbare Tagesübersicht aus denselben Daten wie Today und Calendar. Gedacht für einen späteren,
 * eigens abgesicherten Endpunkt, den der ElevenLabs-Agent als Tool aufruft.
 */
export function voiceAgenda(events: CalendarEvent[], day: string, timeZone: string): VoiceAgenda {
  return {
    date: day,
    events: eventsOnDay(events, day, timeZone).map((e) => ({
      time: timeRangeOn(e, day, timeZone),
      title: e.title,
      location: e.location,
    })),
  };
}
