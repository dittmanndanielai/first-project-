import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { logError } from "@/lib/log";
import { dateLabel, dayOfYear, greeting, isoDate, minutesOfDay } from "@/lib/time";
import { classifyEvents, DEMO_EVENTS } from "@/features/calendar/upcoming";
import { HeaderSkeleton, PageHeader } from "@/features/shell/PageHeader";
import { deriveToday } from "@/features/tasks/rules";
import { listTasks } from "@/features/tasks/store";
import type { Task } from "@/features/tasks/types";
import { lawIndexForDay } from "@/features/today/laws";
import { TodayBoard } from "@/features/today/components/TodayBoard";

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <Today />
    </Suspense>
  );
}

async function Today() {
  await requireSession();
  const e = env();
  const now = new Date();
  const tz = e.APP_TIMEZONE;

  let tasks: Task[] = [];
  let synced = true;
  try {
    tasks = await listTasks();
  } catch (err) {
    synced = false;
    logError("today.tasks", err);
  }

  // Kalender folgt in Phase 4 (iCal). Bis dahin Demo-Termine nur im Mock-Modus.
  const calendarConnected = e.DATA_SOURCE === "mock";
  const { events, next, inMinutes } = classifyEvents(calendarConnected ? DEMO_EVENTS : [], minutesOfDay(now, tz));

  const { progress } = deriveToday(tasks);
  const summary = [`${progress.left} tasks left`, next ? `${next.title.split(" — ")[0]} at ${next.start}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader dateLabel={dateLabel(now, tz)} title={greeting(now, e.OWNER_NAME, tz)} summary={summary} synced={synced} />
      <TodayBoard
        tasks={tasks}
        today={isoDate(now, tz)}
        events={events}
        nextIn={inMinutes}
        calendarConnected={calendarConnected}
        lawIndex={lawIndexForDay(dayOfYear(now, tz))}
      />
    </>
  );
}

function TodaySkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="grid3">
        <div className="col">
          <div className="card skeleton" style={{ height: 230 }} />
          <div className="card skeleton" style={{ height: 360 }} />
        </div>
        <div className="col col-center">
          <div className="card skeleton" style={{ height: 62 }} />
          <div className="card skeleton" style={{ height: 520 }} />
        </div>
        <div className="col">
          <div className="card skeleton" style={{ height: 300 }} />
          <div className="card skeleton" style={{ height: 124 }} />
        </div>
      </div>
    </>
  );
}
