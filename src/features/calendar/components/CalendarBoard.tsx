import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { dateLabel, shortDayLabel, timeLabel, zonedTime } from "@/lib/time";
import { calendarHref, endOf, eventsOnDay, timeRangeOn, weekTitle, type ViewState } from "../rules";
import type { CalendarData, CalendarEvent } from "../types";
import { RefreshButton } from "./RefreshButton";

// Kalenderseite: Tag und Woche, nur lesend. Server-Komponente; nur der Refresh-Knopf läuft im Browser.

type Props = {
  data: CalendarData;
  demo: boolean;
  state: ViewState;
  now: number;
  today: string;
  timeZone: string;
};

export function CalendarBoard({ data, demo, state, now, today, timeZone }: Props) {
  const title = state.view === "day" ? dateLabel(new Date(zonedTime(state.date, "12:00", timeZone)), timeZone) : weekTitle(state.days);
  const step = state.view === "day" ? "day" : "week";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section className="card cal-toolbar" aria-label="Calendar navigation">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <h2 className="card-title" style={{ fontSize: 17, letterSpacing: "-.01em" }} aria-live="polite">
            {title}
          </h2>
          {demo ? <span className="chip">Demo data</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!demo ? (
            <span className="hide-sm" style={{ fontSize: 12, color: "var(--text3)" }} title="iCloud can take a few minutes to publish changes">
              Updated {timeLabel(data.fetchedAt, timeZone)}
            </span>
          ) : null}
          <RefreshButton />
        </div>
        <div className="cal-toolbar-row">
          <nav className="seg" aria-label="View">
            <Link href={calendarHref("day", state.date)} className={state.view === "day" ? "on" : ""} aria-current={state.view === "day" ? "page" : undefined}>
              Day
            </Link>
            <Link href={calendarHref("week", state.date)} className={state.view === "week" ? "on" : ""} aria-current={state.view === "week" ? "page" : undefined}>
              Week
            </Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NavButton href={state.prev ? calendarHref(state.view, state.prev) : null} label={`Previous ${step}`}>
              <ChevronLeftIcon size={16} />
            </NavButton>
            <Link href={calendarHref(state.view, today)} className="btn" style={{ height: 32 }}>
              Today
            </Link>
            <NavButton href={state.next ? calendarHref(state.view, state.next) : null} label={`Next ${step}`}>
              <ChevronRightIcon size={16} />
            </NavButton>
          </div>
        </div>
      </section>

      {data.failed > 0 ? (
        <div className="card" style={{ padding: "12px 16px", fontSize: 13, color: "var(--text2)" }}>
          {data.failed === 1 ? "One calendar" : `${data.failed} calendars`} could not be loaded right now. Showing the others.
        </div>
      ) : null}

      {state.view === "day" ? (
        <DayView events={eventsOnDay(data.events, state.date, timeZone)} day={state.date} now={now} today={today} timeZone={timeZone} />
      ) : (
        <div className="cal-week">
          {state.days.map((day) => (
            <WeekDay
              key={day}
              day={day}
              events={eventsOnDay(data.events, day, timeZone)}
              now={now}
              today={today}
              timeZone={timeZone}
              synced={day >= data.from && day <= data.to}
            />
          ))}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
        Read-only. Shows {shortDayLabel(data.from)} to {shortDayLabel(data.to)}. Changes in iCloud can take a few minutes to appear.
      </p>
    </div>
  );
}

function NavButton({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <button type="button" className="btn icon-btn" style={{ height: 32, width: 32 }} disabled aria-label={label}>
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className="btn icon-btn" style={{ height: 32, width: 32 }} aria-label={label}>
      {children}
    </Link>
  );
}

function DayView({ events, day, now, today, timeZone }: { events: CalendarEvent[]; day: string; now: number; today: string; timeZone: string }) {
  const allDay = events.filter((e) => e.allDay);
  const timed = events.filter((e) => !e.allDay);
  const nextId = day === today ? timed.find((e) => endOf(e) > now)?.id : undefined;

  return (
    <section className="card" style={{ padding: "18px 14px", display: "flex", flexDirection: "column", gap: 10 }} aria-label={`Events on ${shortDayLabel(day)}`}>
      {allDay.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 6px 4px" }}>
          {allDay.map((e) => (
            <span key={e.id} className="chip" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
              All day · {e.title}
            </span>
          ))}
        </div>
      ) : null}
      {timed.length === 0 ? (
        <div style={{ padding: "28px 8px", textAlign: "center", fontSize: 13.5, color: "var(--text2)" }}>
          {allDay.length ? "No other events." : "No events."}
        </div>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {timed.map((e) => {
            const past = endOf(e) <= now;
            const isNext = e.id === nextId;
            return (
              <li key={e.id} className={`cal-row ${past ? "past" : ""} ${isNext ? "now" : ""}`}>
                <span style={{ fontSize: 13, color: isNext ? "var(--accent)" : "var(--text2)", fontWeight: isNext ? 600 : 500, fontVariantNumeric: "tabular-nums" }}>
                  {timeRangeOn(e, day, timeZone)}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.005em", overflowWrap: "anywhere" }}>{e.title}</span>
                  {e.location ? <span style={{ fontSize: 12.5, color: "var(--text2)", overflowWrap: "anywhere" }}>{e.location}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function WeekDay({
  day,
  events,
  now,
  today,
  timeZone,
  synced,
}: {
  day: string;
  events: CalendarEvent[];
  now: number;
  today: string;
  timeZone: string;
  synced: boolean;
}) {
  const [weekday, num] = shortDayLabel(day).split(" ");
  const isToday = day === today;
  return (
    <section className={`card cal-day ${isToday ? "today" : ""}`} aria-label={shortDayLabel(day)}>
      <Link href={calendarHref("day", day)} className="cal-dayhead" aria-current={isToday ? "date" : undefined}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: isToday ? "var(--accent)" : "var(--text2)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          {weekday}
        </span>
        <span className="cal-daynum">{num}</span>
      </Link>
      {!synced ? (
        <span className="cal-empty">Not synced</span>
      ) : events.length === 0 ? (
        <span className="cal-empty">No events</span>
      ) : (
        events.map((e) => (
          <Link key={e.id} href={calendarHref("day", day)} className={`cal-ev ${!e.allDay && endOf(e) <= now ? "past" : ""} ${e.allDay ? "allday" : ""}`}>
            <span style={{ fontSize: 11.5, color: "var(--text2)", fontVariantNumeric: "tabular-nums" }}>{timeRangeOn(e, day, timeZone)}</span>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflowWrap: "anywhere" }}>{e.title}</span>
            {e.location ? <span style={{ fontSize: 11.5, color: "var(--text3)", overflowWrap: "anywhere" }}>{e.location}</span> : null}
          </Link>
        ))
      )}
    </section>
  );
}
