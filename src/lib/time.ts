// Alle Datumswerte in der Zeitzone des Nutzers. Vercel läuft in UTC:
// new Date().toISOString().slice(0, 10) wäre zwischen 0 und 2 Uhr der falsche Tag.

export const DEFAULT_TZ = "Europe/Berlin";

/** YYYY-MM-DD in der angegebenen Zeitzone. */
export function isoDate(date: Date, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function hourIn(date: Date, timeZone = DEFAULT_TZ): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date);
  return Number(h);
}

/** Minuten seit Mitternacht in der Zeitzone (für „Next · in 36 min“). */
export function minutesOfDay(date: Date, timeZone = DEFAULT_TZ): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/** z. B. "Monday, 12 October" (wie im Design). */
export function dateLabel(date: Date, timeZone = DEFAULT_TZ): string {
  // Aus Einzelteilen gebaut: die Kommasetzung von en-GB unterscheidet sich je nach ICU-Version.
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long" }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")}, ${get("day")} ${get("month")}`;
}

export function greeting(date: Date, name: string, timeZone = DEFAULT_TZ): string {
  const h = hourIn(date, timeZone);
  const part = h < 5 ? "evening" : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}`;
}

/** Tag des Jahres (1–366) in der Zeitzone, für die tägliche „Law“-Karte. */
export function dayOfYear(date: Date, timeZone = DEFAULT_TZ): number {
  const [y, m, d] = isoDate(date, timeZone).split("-").map(Number);
  const start = Date.UTC(y, 0, 1);
  return Math.floor((Date.UTC(y, m - 1, d) - start) / 86_400_000) + 1;
}

/** Kalendertag (YYYY-MM-DD) als kurzes Label, z. B. "Tue 13 Oct". Ohne Zeitzone: Datum ist bereits lokal. */
export function shortDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")}`;
}

/** Kalendertag plus n Tage (YYYY-MM-DD), n darf negativ sein. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Ganze Kalendertage von `from` bis `to` (YYYY-MM-DD), negativ, wenn `to` früher liegt. */
export function daysBetween(from: string, to: string): number {
  const utc = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** Kalendertag minus n Tage (YYYY-MM-DD). */
export function minusDays(iso: string, days: number): string {
  return addDays(iso, -days);
}

/** true für einen gültigen Kalendertag im Format YYYY-MM-DD. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return addDays(value, 0) === value; // fängt 2026-02-30 ab
}

/** Montag der Woche (ISO-Woche) eines Kalendertags. */
export function weekStart(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sonntag
  return addDays(iso, -((weekday + 6) % 7));
}

// Formatter sind teuer; für Termine (hunderte Aufrufe pro Seite) einmal pro Zeitzone anlegen.
const clockFormat = new Map<string, Intl.DateTimeFormat>();
const wallFormat = new Map<string, Intl.DateTimeFormat>();

function memo(cache: Map<string, Intl.DateTimeFormat>, timeZone: string, options: Intl.DateTimeFormatOptions) {
  let f = cache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone, ...options });
    cache.set(timeZone, f);
  }
  return f;
}

/** Uhrzeit HH:MM (24 h) eines Zeitpunkts in der Zeitzone. */
export function timeLabel(ms: number, timeZone = DEFAULT_TZ): string {
  return memo(clockFormat, timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ms);
}

/** Abstand der Zeitzone zu UTC in Minuten zum Zeitpunkt `ms` (Berlin: 60 im Winter, 120 im Sommer). */
function offsetMinutes(ms: number, timeZone: string): number {
  const parts = memo(wallFormat, timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((wall - Math.floor(ms / 1000) * 1000) / 60_000);
}

/** Zeitpunkt (ms) einer Uhrzeit an einem Kalendertag in der Zeitzone, z. B. 09:00 in Berlin. Beachtet die Zeitumstellung. */
export function zonedTime(iso: string, hhmm = "00:00", timeZone = DEFAULT_TZ): number {
  const [y, m, d] = iso.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min);
  const first = wall - offsetMinutes(wall, timeZone) * 60_000;
  // Zweiter Schritt, falls zwischen Schätzung und Ergebnis die Zeitumstellung liegt.
  return wall - offsetMinutes(first, timeZone) * 60_000;
}

/** 00:00 eines Kalendertags in der Zeitzone als Zeitpunkt (ms). */
export function startOfDay(iso: string, timeZone = DEFAULT_TZ): number {
  return zonedTime(iso, "00:00", timeZone);
}

/** Kalendertag (YYYY-MM-DD) als kurzes deutsches Label, z. B. "Di. 13. Okt." (Discover-Karten). */
export function germanDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const parts = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")}. ${get("month")}`; // ICU kürzt selbst: „Okt.“, aber „Mai“
}
