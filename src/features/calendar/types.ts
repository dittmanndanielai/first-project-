// Kalender-Datenform für Today, Calendar und später den Sprachassistenten.
// Quelle: öffentlicher iCloud-Kalender (ICS), nur lesend. Zeiten als Zeitpunkte (ms seit 1970, UTC),
// dargestellt wird immer in APP_TIMEZONE (lib/time).

export type CalendarEvent = {
  id: string;
  title: string;
  location: string | null;
  allDay: boolean;
  /** Beginn. Ganztägig: 00:00 des ersten Tags in der App-Zeitzone. */
  start: number;
  /** Ende, exklusiv. Ganztägig: 00:00 nach dem letzten Tag. */
  end: number;
};

export type CalendarData = {
  events: CalendarEvent[];
  /** Zeitpunkt des Abrufs bei iCloud (ms). */
  fetchedAt: number;
  /** Geladener Zeitraum, Kalendertage inklusive (YYYY-MM-DD). */
  from: string;
  to: string;
  /** Anzahl Kalender-Links, die gerade nicht geladen werden konnten. */
  failed: number;
};

export type CalendarResult =
  | ({ status: "ok"; source: "icloud" | "demo" } & CalendarData)
  | { status: "not_configured" } // ICLOUD_CALENDAR_URL fehlt
  | { status: "invalid_config" } // Wert ist kein iCloud-Kalenderlink
  | { status: "error" }; // iCloud nicht erreichbar oder Antwort unbrauchbar
