import { afterEach, describe, expect, it } from "vitest";
import { eventsFromIcs, IcsParseError } from "@/features/calendar/ics";
import { dayOf, eventsOnDay, timeRangeOn } from "@/features/calendar/rules";
import { timeLabel } from "@/lib/time";

// ICS in der Form, wie iCloud sie für öffentliche Kalender ausliefert (Apple PRODID, VTIMEZONE, X-APPLE-Felder).
const TZ = "Europe/Berlin";

function calendar(...events: string[]) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Apple Inc.//iCloud 2.0//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Privat",
    "X-APPLE-CALENDAR-COLOR:#1BADF8",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Berlin",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "DTSTART:19810329T020000",
    "TZNAME:MESZ",
    "TZOFFSETTO:+0200",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "DTSTART:19961027T030000",
    "TZNAME:MEZ",
    "TZOFFSETTO:+0100",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

const vevent = (lines: string[]) => ["BEGIN:VEVENT", "DTSTAMP:20261001T080000Z", ...lines, "END:VEVENT"].join("\r\n");

const range = { from: "2026-10-12", to: "2026-11-08" };
const berlin = (ms: number) => `${dayOf(ms, TZ)} ${timeLabel(ms, TZ)}`;

describe("eventsFromIcs: Wiederholungen und Ausnahmen", () => {
  const ics = calendar(
    vevent([
      "UID:standup@icloud",
      "DTSTART;TZID=Europe/Berlin:20261012T090000",
      "DTEND;TZID=Europe/Berlin:20261012T093000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261104T235959Z",
      "EXDATE;TZID=Europe/Berlin:20261014T090000",
      "SUMMARY:Stand-up",
      "LOCATION:Zoom",
    ]),
    vevent([
      "UID:standup@icloud",
      "RECURRENCE-ID;TZID=Europe/Berlin:20261019T090000",
      "DTSTART;TZID=Europe/Berlin:20261019T110000",
      "DTEND;TZID=Europe/Berlin:20261019T113000",
      "SUMMARY:Stand-up (moved)",
    ]),
  );
  const events = eventsFromIcs(ics, range, TZ);

  it("bleibt über die Zeitumstellung (25.10.) um 09:00 Berliner Zeit", () => {
    const starts = events.map((e) => berlin(e.start));
    expect(starts).toContain("2026-10-21 09:00"); // Sommerzeit, 07:00 UTC
    expect(starts).toContain("2026-10-26 09:00"); // Winterzeit, 08:00 UTC
    const oct26 = events.find((e) => dayOf(e.start, TZ) === "2026-10-26");
    expect(new Date(oct26!.start).toISOString()).toBe("2026-10-26T08:00:00.000Z");
  });

  it("lässt EXDATE weg und übernimmt verschobene Einzeltermine (RECURRENCE-ID)", () => {
    const days = events.map((e) => dayOf(e.start, TZ));
    expect(days).not.toContain("2026-10-14");
    const moved = events.find((e) => dayOf(e.start, TZ) === "2026-10-19");
    expect(moved?.title).toBe("Stand-up (moved)");
    expect(berlin(moved!.start)).toBe("2026-10-19 11:00");
  });

  it("endet mit UNTIL und liefert eindeutige IDs", () => {
    expect(events.map((e) => dayOf(e.start, TZ))).toEqual([
      "2026-10-12",
      "2026-10-19",
      "2026-10-21",
      "2026-10-26",
      "2026-10-28",
      "2026-11-02",
      "2026-11-04",
    ]);
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  });
});

describe("eventsFromIcs: ganztägig, mehrtägig, Sonderfälle", () => {
  const ics = calendar(
    vevent(["UID:trip", "DTSTART;VALUE=DATE:20261024", "DTEND;VALUE=DATE:20261027", "SUMMARY:Trip to Vienna"]),
    vevent(["UID:bday", "DTSTART;VALUE=DATE:20001015", "DTEND;VALUE=DATE:20001016", "RRULE:FREQ=YEARLY", "SUMMARY:Mum’s birthday"]),
    vevent([
      "UID:overnight",
      "DTSTART;TZID=Europe/Berlin:20261024T230000",
      "DTEND;TZID=Europe/Berlin:20261025T010000",
      "SUMMARY:Night train",
    ]),
    vevent(["UID:utc", "DTSTART:20261020T170000Z", "DTEND:20261020T180000Z", "SUMMARY:Call with NYC"]),
    vevent(["UID:dur", "DTSTART;TZID=Europe/Berlin:20261021T100000", "DURATION:PT45M", "SUMMARY:Dentist"]),
    vevent(["UID:cancel", "DTSTART;TZID=Europe/Berlin:20261022T100000", "DTEND;TZID=Europe/Berlin:20261022T110000", "STATUS:CANCELLED", "SUMMARY:Cancelled"]),
    vevent(["UID:old", "DTSTART;TZID=Europe/Berlin:20240101T100000", "DTEND;TZID=Europe/Berlin:20240101T110000", "SUMMARY:Long ago"]),
    vevent([
      "UID:text",
      "DTSTART;TZID=Europe/Berlin:20261023T120000",
      "DTEND;TZID=Europe/Berlin:20261023T130000",
      "SUMMARY:Lunch\\, then   walk",
      "LOCATION:Café Luitpold\\nBrienner Str. 11\\n80333 München",
      "DESCRIPTION:Private notes that must not be stored",
    ]),
    vevent(["UID:untitled", "DTSTART;TZID=Europe/Berlin:20261023T150000", "DTEND;TZID=Europe/Berlin:20261023T151500"]),
  );
  const events = eventsFromIcs(ics, range, TZ);
  const byTitle = (t: string) => events.find((e) => e.title === t);

  it("legt ganztägige Termine auf Berliner Mitternacht und zeigt sie an jedem ihrer Tage", () => {
    const trip = byTitle("Trip to Vienna")!;
    expect(trip.allDay).toBe(true);
    expect(berlin(trip.start)).toBe("2026-10-24 00:00");
    expect(berlin(trip.end)).toBe("2026-10-27 00:00"); // exklusiv
    expect(eventsOnDay(events, "2026-10-26", TZ).map((e) => e.title)).toContain("Trip to Vienna");
    expect(eventsOnDay(events, "2026-10-27", TZ).map((e) => e.title)).not.toContain("Trip to Vienna");
  });

  it("expandiert jährliche ganztägige Termine (Geburtstage)", () => {
    expect(dayOf(byTitle("Mum’s birthday")!.start, TZ)).toBe("2026-10-15");
  });

  it("zeigt Termine über Mitternacht an beiden Tagen mit passender Uhrzeit", () => {
    const night = byTitle("Night train")!;
    expect(timeRangeOn(night, "2026-10-24", TZ)).toBe("from 23:00");
    expect(timeRangeOn(night, "2026-10-25", TZ)).toBe("until 01:00");
  });

  it("rechnet UTC-Termine und DURATION in Berliner Zeit um", () => {
    expect(berlin(byTitle("Call with NYC")!.start)).toBe("2026-10-20 19:00");
    const dentist = byTitle("Dentist")!;
    expect(timeRangeOn(dentist, "2026-10-21", TZ)).toBe("10:00 – 10:45");
  });

  it("lässt abgesagte und alte Termine weg", () => {
    expect(byTitle("Cancelled")).toBeUndefined();
    expect(byTitle("Long ago")).toBeUndefined();
  });

  it("säubert Titel und Ort und speichert keine Beschreibung", () => {
    const lunch = byTitle("Lunch, then walk")!;
    expect(lunch.location).toBe("Café Luitpold");
    expect(JSON.stringify(events)).not.toContain("Private notes");
    expect(events.find((e) => e.id.includes("untitled"))?.title).toBe("Untitled");
  });

  it("sortiert nach Beginn", () => {
    const starts = events.map((e) => e.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });
});

describe("eventsFromIcs: unabhängig von der Zeitzone des Servers", () => {
  const original = process.env.TZ;
  afterEach(() => {
    process.env.TZ = original;
  });

  const ics = calendar(
    vevent(["UID:allday", "DTSTART;VALUE=DATE:20261025", "DTEND;VALUE=DATE:20261026", "SUMMARY:Sunday off"]),
    vevent(["UID:timed", "DTSTART;TZID=Europe/Berlin:20261025T090000", "DTEND;TZID=Europe/Berlin:20261025T100000", "SUMMARY:Brunch"]),
  );

  for (const serverTz of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
    it(`liefert dieselben Zeitpunkte bei TZ=${serverTz}`, () => {
      process.env.TZ = serverTz;
      const events = eventsFromIcs(ics, range, TZ);
      expect(events.map((e) => [e.title, berlin(e.start), berlin(e.end)])).toEqual([
        ["Sunday off", "2026-10-25 00:00", "2026-10-26 00:00"],
        ["Brunch", "2026-10-25 09:00", "2026-10-25 10:00"],
      ]);
    });
  }
});

describe("eventsFromIcs: Fehlerfälle", () => {
  it("liefert für einen leeren Kalender keine Termine", () => {
    expect(eventsFromIcs(calendar(), range, TZ)).toEqual([]);
  });

  it("überspringt Termine ohne Beginn statt abzubrechen", () => {
    const ics = calendar(
      vevent(["UID:broken", "SUMMARY:No start"]),
      vevent(["UID:ok", "DTSTART;TZID=Europe/Berlin:20261020T100000", "DTEND;TZID=Europe/Berlin:20261020T110000", "SUMMARY:Fine"]),
    );
    expect(eventsFromIcs(ics, range, TZ).map((e) => e.title)).toEqual(["Fine"]);
  });

  it("meldet unlesbare Daten als IcsParseError ohne Termininhalte", () => {
    const ics = calendar(
      vevent(["UID:bad-rule", "DTSTART;TZID=Europe/Berlin:20261020T100000", "RRULE:FREQ=WEEKLY;BYDAY=XX", "SUMMARY:Secret meeting"]),
    );
    expect(() => eventsFromIcs(ics, range, TZ)).toThrow(IcsParseError);
    expect(() => eventsFromIcs(ics, range, TZ)).toThrow(/^(?!.*Secret)/);
  });
});
