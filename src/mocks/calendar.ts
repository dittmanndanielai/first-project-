import { addDays, zonedTime } from "@/lib/time";
import type { CalendarEvent } from "@/features/calendar/types";

// Beispieltermine aus dem Design (Board „Today“), für DATA_SOURCE=mock ohne ICLOUD_CALENDAR_URL.

type Demo = { day: number; start: string; end: string; title: string; location: string | null; allDay?: boolean };

const DEMO: Demo[] = [
  { day: 0, start: "09:00", end: "09:30", title: "WEM team stand-up", location: "Google Meet" },
  { day: 0, start: "11:00", end: "11:45", title: "Weldstone — proposal review", location: "Zoom" },
  { day: 0, start: "14:00", end: "16:00", title: "Deep work — Personal OS", location: "Focus block" },
  { day: 0, start: "16:30", end: "17:00", title: "Motion HQ sync", location: "Phone" },
  { day: 0, start: "19:00", end: "20:00", title: "Gym", location: "Übersee" },
  { day: 1, start: "08:30", end: "09:00", title: "Weekly planning", location: null },
  { day: 1, start: "13:00", end: "14:00", title: "Lunch with Patrick", location: "Prien am Chiemsee" },
  { day: 2, start: "00:00", end: "00:00", title: "Mum’s birthday", location: null, allDay: true },
  { day: 3, start: "10:00", end: "11:30", title: "Bank appointment", location: "Rosenheim" },
];

export function demoEvents(today: string, timeZone: string): CalendarEvent[] {
  return DEMO.map((d, i) => {
    const day = addDays(today, d.day);
    const start = d.allDay ? zonedTime(day, "00:00", timeZone) : zonedTime(day, d.start, timeZone);
    const end = d.allDay ? zonedTime(addDays(day, 1), "00:00", timeZone) : zonedTime(day, d.end, timeZone);
    return { id: `demo-${i}`, title: d.title, location: d.location, allDay: Boolean(d.allDay), start, end };
  });
}
