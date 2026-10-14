import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { dateLabel, isoDate } from "@/lib/time";
import { CalendarBoard } from "@/features/calendar/components/CalendarBoard";
import { RefreshButton } from "@/features/calendar/components/RefreshButton";
import { eventsOnDay, viewState } from "@/features/calendar/rules";
import { getCalendar } from "@/features/calendar/store";
import { HeaderSkeleton, PageHeader } from "@/features/shell/PageHeader";

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <Calendar searchParams={searchParams} />
    </Suspense>
  );
}

async function Calendar({ searchParams }: { searchParams: PageProps<"/calendar">["searchParams"] }) {
  await requireSession();
  const e = env();
  const tz = e.APP_TIMEZONE;
  const date = new Date();
  const now = date.getTime();
  const today = isoDate(date, tz);
  const [params, calendar] = await Promise.all([searchParams, getCalendar()]);

  const header = (summary?: string) => <PageHeader dateLabel={dateLabel(date, tz)} title="Calendar" summary={summary} />;

  if (calendar.status !== "ok") {
    const notice =
      calendar.status === "not_configured"
        ? {
            title: "Connect your iCloud calendar",
            text: "On iPhone: Calendar › Calendars › (i) next to the calendar › Public Calendar › Share Link. Paste the link in Vercel as ICLOUD_CALENDAR_URL (Production), then redeploy. Never paste it into a chat or the repository.",
          }
        : calendar.status === "invalid_config"
          ? {
              title: "Calendar link not recognised",
              text: "ICLOUD_CALENDAR_URL must be the public iCloud link (webcal://…icloud.com/…). Copy it again from the Calendar app and update it in Vercel.",
            }
          : { title: "Calendar unavailable", text: "iCloud did not respond. Try again in a minute." };
    return (
      <>
        {header()}
        <section className="card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
          <h2 className="card-title">{notice.title}</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text2)" }}>{notice.text}</p>
          {calendar.status === "error" ? (
            <div>
              <RefreshButton />
            </div>
          ) : null}
        </section>
      </>
    );
  }

  const state = viewState(params, today, calendar);
  const todayCount = eventsOnDay(calendar.events, today, tz).length;
  return (
    <>
      {header(`${todayCount} event${todayCount === 1 ? "" : "s"} today`)}
      <CalendarBoard data={calendar} demo={calendar.source === "demo"} state={state} now={now} today={today} timeZone={tz} />
    </>
  );
}

function CalendarSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card skeleton" style={{ height: 104 }} />
        <div className="card skeleton" style={{ height: 420 }} />
      </div>
    </>
  );
}
