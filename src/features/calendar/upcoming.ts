// Kalender-Datenform für Today und Calendar. Quelle ab Phase 4: Google iCal (lib/ical).
// Bis dahin: Demo-Termine aus dem Design im Mock-Modus, sonst leer.

export type CalendarEvent = {
  id: string;
  start: string; // HH:MM in App-Zeitzone
  end: string;
  title: string;
  where: string;
  people: string;
  notes: string;
};

export type UpcomingEvent = CalendarEvent & { state: "past" | "next" | "later" };

export const DEMO_EVENTS: CalendarEvent[] = [
  { id: "e1", start: "09:00", end: "09:30", title: "WEM team stand-up", where: "Google Meet", people: "WEM marketing team", notes: "Weekly priorities and campaign reporting." },
  { id: "e2", start: "11:00", end: "11:45", title: "Weldstone — proposal review", where: "Zoom", people: "Weldstone operations lead, Patrick", notes: "Walk through automation scope and pricing." },
  { id: "e3", start: "14:00", end: "16:00", title: "Deep work — Personal OS", where: "Focus block", people: "Just you", notes: "Quick Capture retry logic, ElevenLabs session tokens." },
  { id: "e4", start: "16:30", end: "17:00", title: "Motion HQ sync", where: "Phone", people: "Patrick", notes: "Q4 roadmap and Weldstone follow-ups." },
  { id: "e5", start: "19:00", end: "20:00", title: "Gym", where: "Übersee", people: "Just you", notes: "Upper body." },
];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Markiert vergangene Termine und den nächsten; liefert die Minuten bis zum nächsten. */
export function classifyEvents(events: CalendarEvent[], nowMinutes: number): { events: UpcomingEvent[]; next: UpcomingEvent | null; inMinutes: number | null } {
  let nextFound = false;
  const out = events.map((e): UpcomingEvent => {
    if (toMin(e.end) <= nowMinutes) return { ...e, state: "past" };
    if (!nextFound && toMin(e.start) >= nowMinutes) {
      nextFound = true;
      return { ...e, state: "next" };
    }
    return { ...e, state: "later" };
  });
  const next = out.find((e) => e.state === "next") ?? null;
  return { events: out, next, inMinutes: next ? toMin(next.start) - nowMinutes : null };
}

export function relativeLabel(minutes: number): string {
  if (minutes < 1) return "now";
  if (minutes < 60) return `in ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `in ${h} h ${m} min` : `in ${h} h`;
}
