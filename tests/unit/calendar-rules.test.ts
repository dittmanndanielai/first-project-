import { describe, expect, it } from "vitest";
import {
  dayLabel,
  eventsOnDay,
  nextLabel,
  relativeLabel,
  timeRangeOn,
  upcoming,
  viewState,
  voiceAgenda,
  weekTitle,
  whenLabel,
} from "@/features/calendar/rules";
import type { CalendarEvent } from "@/features/calendar/types";
import { zonedTime } from "@/lib/time";

const TZ = "Europe/Berlin";
const at = (day: string, hhmm: string) => zonedTime(day, hhmm, TZ);
const ev = (id: string, day: string, start: string, end: string, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  title: id,
  location: null,
  allDay: false,
  start: at(day, start),
  end: at(day, end),
  ...extra,
});
const allDay = (id: string, day: string, nextDay: string): CalendarEvent => ({
  id,
  title: id,
  location: null,
  allDay: true,
  start: at(day, "00:00"),
  end: at(nextDay, "00:00"),
});

const TODAY = "2026-10-14";
const events: CalendarEvent[] = [
  allDay("Holiday", TODAY, "2026-10-15"),
  ev("Stand-up", TODAY, "09:00", "09:30", { location: "Zoom" }),
  ev("Review", TODAY, "11:00", "11:45"),
  ev("Deep work", TODAY, "14:00", "16:00"),
  ev("Gym", TODAY, "19:00", "20:00"),
  ev("Planning", "2026-10-15", "08:30", "09:00"),
  ev("Lunch", "2026-10-16", "13:00", "14:00"),
];

describe("upcoming (Today-Karte)", () => {
  it("nimmt den nächsten Termin mit Uhrzeit und bis zu drei weitere", () => {
    const u = upcoming(events, at(TODAY, "10:24"), TODAY, TZ);
    expect(u.next?.title).toBe("Review");
    expect(u.ongoing).toBe(false);
    expect(u.later.map((e) => e.title)).toEqual(["Deep work", "Gym", "Planning"]);
    expect(u.allDayToday.map((e) => e.title)).toEqual(["Holiday"]);
  });

  it("zeigt einen laufenden Termin als „Now“", () => {
    const now = at(TODAY, "14:30");
    const u = upcoming(events, now, TODAY, TZ);
    expect(u.next?.title).toBe("Deep work");
    expect(u.ongoing).toBe(true);
    expect(nextLabel(u.next!, now, TODAY, TZ)).toBe("Now · until 16:00");
  });

  it("springt nach dem letzten Termin auf morgen", () => {
    const now = at(TODAY, "21:00");
    const u = upcoming(events, now, TODAY, TZ);
    expect(u.next?.title).toBe("Planning");
    expect(nextLabel(u.next!, now, TODAY, TZ)).toBe("Tomorrow");
    expect(u.later.map((e) => e.title)).toEqual(["Lunch"]);
  });

  it("ist leer ohne kommende Termine", () => {
    const u = upcoming([], at(TODAY, "10:00"), TODAY, TZ);
    expect(u).toEqual({ next: null, ongoing: false, later: [], allDayToday: [] });
  });
});

describe("Beschriftungen", () => {
  it("relativeLabel", () => {
    expect(relativeLabel(0)).toBe("now");
    expect(relativeLabel(36)).toBe("in 36 min");
    expect(relativeLabel(60)).toBe("in 1 h");
    expect(relativeLabel(95)).toBe("in 1 h 35 min");
  });

  it("nextLabel rundet auf volle Minuten auf", () => {
    const review = events[2];
    expect(nextLabel(review, at(TODAY, "10:24") + 30_000, TODAY, TZ)).toBe("in 36 min");
  });

  it("dayLabel und whenLabel", () => {
    expect(dayLabel(TODAY, TODAY)).toBe("Today");
    expect(dayLabel("2026-10-15", TODAY)).toBe("Tomorrow");
    expect(dayLabel("2026-10-16", TODAY)).toBe("Fri 16 Oct");
    expect(whenLabel(events[1], TODAY, TZ)).toBe("09:00");
    expect(whenLabel(events[5], TODAY, TZ)).toBe("Tomorrow · 08:30");
    expect(whenLabel(events[6], TODAY, TZ)).toBe("Fri 16 Oct · 13:00");
    expect(whenLabel(events[0], TODAY, TZ)).toBe("All day");
  });

  it("timeRangeOn", () => {
    expect(timeRangeOn(events[1], TODAY, TZ)).toBe("09:00 – 09:30");
    expect(timeRangeOn(events[0], TODAY, TZ)).toBe("All day");
    const point = ev("Reminder", TODAY, "12:00", "12:00");
    expect(timeRangeOn(point, TODAY, TZ)).toBe("12:00");
  });

  it("weekTitle über Monats- und Jahresgrenzen", () => {
    expect(weekTitle(["2026-10-12", "2026-10-18"])).toBe("12 – 18 Oct 2026");
    expect(weekTitle(["2026-10-26", "2026-11-01"])).toBe("26 Oct – 1 Nov 2026");
    expect(weekTitle(["2026-12-28", "2027-01-03"])).toBe("28 Dec 2026 – 3 Jan 2027");
  });
});

describe("eventsOnDay", () => {
  it("zählt Termine ohne Dauer zu ihrem Tag", () => {
    const point = ev("Reminder", TODAY, "00:00", "00:00");
    expect(eventsOnDay([point], TODAY, TZ)).toHaveLength(1);
    expect(eventsOnDay([point], "2026-10-13", TZ)).toHaveLength(0);
  });

  it("nimmt einen Termin bis Mitternacht nicht in den Folgetag", () => {
    const late = { ...ev("Late", TODAY, "23:00", "23:00"), end: at("2026-10-15", "00:00") };
    expect(eventsOnDay([late], "2026-10-15", TZ)).toHaveLength(0);
  });
});

describe("viewState (Kalenderseite)", () => {
  const range = { from: "2026-09-30", to: "2027-01-12" };

  it("fällt bei ungültigen Parametern auf Woche und heute zurück", () => {
    const s = viewState({ view: "month", date: "2026-02-30" }, TODAY, range);
    expect(s.view).toBe("week");
    expect(s.date).toBe(TODAY);
    expect(s.days).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
    expect(s.prev).toBe("2026-10-05");
    expect(s.next).toBe("2026-10-19");
  });

  it("navigiert tageweise und stoppt am Rand des geladenen Zeitraums", () => {
    expect(viewState({ view: "day", date: "2026-10-20" }, TODAY, range)).toMatchObject({ days: ["2026-10-20"], prev: "2026-10-19", next: "2026-10-21" });
    expect(viewState({ view: "day", date: "2027-01-12" }, TODAY, range).next).toBeNull();
    expect(viewState({ view: "day", date: "2020-01-01" }, TODAY, range)).toMatchObject({ date: "2026-09-30", prev: null });
  });

  it("nimmt bei Arrays den ersten Wert", () => {
    expect(viewState({ view: ["day", "week"], date: ["2026-10-20"] }, TODAY, range)).toMatchObject({ view: "day", date: "2026-10-20" });
  });

  it("sperrt die Vorwoche, wenn sie ganz vor dem Zeitraum liegt", () => {
    expect(viewState({ view: "week", date: "2026-09-30" }, TODAY, range).prev).toBeNull();
    expect(viewState({ view: "week", date: "2026-10-07" }, TODAY, range).prev).toBe("2026-09-28");
  });
});

describe("voiceAgenda (für den ElevenLabs-Agenten vorbereitet)", () => {
  it("liefert eine kompakte, sprechbare Tagesübersicht", () => {
    expect(voiceAgenda(events, TODAY, TZ)).toEqual({
      date: TODAY,
      events: [
        { time: "All day", title: "Holiday", location: null },
        { time: "09:00 – 09:30", title: "Stand-up", location: "Zoom" },
        { time: "11:00 – 11:45", title: "Review", location: null },
        { time: "14:00 – 16:00", title: "Deep work", location: null },
        { time: "19:00 – 20:00", title: "Gym", location: null },
      ],
    });
  });
});
