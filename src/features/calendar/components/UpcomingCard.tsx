import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { env } from "@/lib/env";
import { isoDate, timeLabel } from "@/lib/time";
import { calendarHref, dayOf, nextLabel, timeRangeOn, upcoming, whenLabel } from "../rules";
import { getCalendar } from "../store";
import type { CalendarResult } from "../types";

// Today-Karte „Upcoming“: nächster Termin, bis zu drei weitere, Link zur Kalenderseite.
// Server-Komponente in eigener Suspense-Grenze: ein langsamer iCloud-Abruf hält das Dashboard nicht auf.

export async function TodayCalendarCard() {
  const result = await getCalendar();
  return <UpcomingCard result={result} now={new Date().getTime()} timeZone={env().APP_TIMEZONE} />;
}

/** Kurzinfo für die Kopfzeile von Today, z. B. "Stand-up at 09:00". Nur für Termine von heute. */
export async function NextEventSummary({ prefix }: { prefix: string }) {
  const result = await getCalendar();
  const tz = env().APP_TIMEZONE;
  if (result.status !== "ok") return prefix;
  const now = new Date();
  const today = isoDate(now, tz);
  const { next, ongoing } = upcoming(result.events, now.getTime(), today, tz);
  if (!next || ongoing || dayOf(next.start, tz) !== today) return prefix;
  return `${prefix} · ${next.title.split(" — ")[0]} at ${timeLabel(next.start, tz)}`;
}

function Shell({ children, demo = false }: { children: React.ReactNode; demo?: boolean }) {
  return (
    <section className="card m-upcoming" style={{ padding: "20px 14px 14px", display: "flex", flexDirection: "column", gap: 12 }} aria-labelledby="up-h">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 id="up-h" className="card-title">
            Upcoming
          </h2>
          {demo ? (
            <span className="chip" style={{ height: 20, fontSize: 10.5 }}>
              Demo data
            </span>
          ) : null}
        </div>
        <Link href="/calendar" className="mini" aria-label="Open calendar">
          <ChevronRightIcon size={15} />
        </Link>
      </div>
      {children}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: "0 6px 6px", padding: "14px 16px", borderRadius: 16, background: "var(--fill)", fontSize: 13, color: "var(--text2)", lineHeight: 1.45 }}>
      {children}
    </div>
  );
}

export function UpcomingCard({ result, now, timeZone }: { result: CalendarResult; now: number; timeZone: string }) {
  if (result.status === "not_configured") {
    return (
      <Shell>
        <Note>Add your iCloud calendar link as ICLOUD_CALENDAR_URL in Vercel to see your events here.</Note>
      </Shell>
    );
  }
  if (result.status === "invalid_config") {
    return (
      <Shell>
        <Note>ICLOUD_CALENDAR_URL is not an iCloud calendar link. Copy the public link again from the Calendar app.</Note>
      </Shell>
    );
  }
  if (result.status === "error") {
    return (
      <Shell>
        <Note>iCloud did not respond. Your calendar will be back on the next refresh.</Note>
      </Shell>
    );
  }

  const today = isoDate(new Date(now), timeZone);
  const { next, ongoing, later, allDayToday } = upcoming(result.events, now, today, timeZone);
  const demo = result.source === "demo";

  return (
    <Shell demo={demo}>
      {allDayToday.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 6px" }}>
          {allDayToday.map((e) => (
            <span key={e.id} className="chip" title="All day" style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {e.title}
            </span>
          ))}
        </div>
      ) : null}

      {next ? (
        <Link
          href={calendarHref("day", dayOf(next.start, timeZone))}
          className="cal-next"
          style={{ margin: "0 4px", padding: "14px 16px", borderRadius: 16, background: "var(--accentSoft)", display: "flex", flexDirection: "column", gap: 4, color: "inherit" }}
        >
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            {ongoing ? nextLabel(next, now, today, timeZone) : `Next · ${nextLabel(next, now, today, timeZone)}`}
          </span>
          <span style={{ fontSize: 16, fontWeight: 650, letterSpacing: "-.01em", overflowWrap: "anywhere" }}>{next.title}</span>
          <span style={{ fontSize: 12.5, color: "var(--text2)" }}>
            {timeRangeOn(next, dayOf(next.start, timeZone), timeZone)}
            {next.location ? ` · ${next.location}` : ""}
          </span>
        </Link>
      ) : (
        <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 13.5, color: "var(--text2)" }}>No upcoming events.</div>
      )}

      {later.length ? (
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div aria-hidden="true" style={{ position: "absolute", left: 14, top: 16, bottom: 16, width: 1, background: "var(--line2)" }} />
          {later.map((e) => (
            <Link key={e.id} href={calendarHref("day", dayOf(e.start, timeZone))} className="ev" style={{ position: "relative", color: "inherit" }}>
              <span className="ev-dot" />
              <span style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 550, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                <span style={{ fontSize: 12, color: "var(--text2)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {whenLabel(e, today, timeZone)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 6px" }}>
        <Link href="/calendar" className="btn btn-ghost" style={{ height: 24, padding: 0, fontSize: 12.5, color: "var(--accent)" }}>
          Open calendar
        </Link>
        {!demo ? (
          <span style={{ fontSize: 11.5, color: "var(--text3)" }} title="iCloud can take a few minutes to publish changes">
            Updated {timeLabel(result.fetchedAt, timeZone)}
          </span>
        ) : null}
      </div>
    </Shell>
  );
}

export function UpcomingSkeleton() {
  return <div className="card skeleton m-upcoming" style={{ height: 300 }} />;
}
