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
