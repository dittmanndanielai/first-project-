import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { logError } from "@/lib/log";
import { dateLabel, dayOfYear, greeting, isoDate } from "@/lib/time";
import { NextEventSummary, TodayCalendarCard, UpcomingSkeleton } from "@/features/calendar/components/UpcomingCard";
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

  // Kalender (iCloud) in eigenen Suspense-Grenzen: Aufgaben erscheinen sofort, Termine kommen nach.
  const tasksLeft = `${deriveToday(tasks).progress.left} tasks left`;
  const summary = (
    <Suspense fallback={tasksLeft}>
      <NextEventSummary prefix={tasksLeft} />
    </Suspense>
  );

  return (
    <>
      <PageHeader dateLabel={dateLabel(now, tz)} title={greeting(now, e.OWNER_NAME, tz)} summary={summary} synced={synced} />
      <TodayBoard
        tasks={tasks}
        today={isoDate(now, tz)}
        calendar={
          <Suspense fallback={<UpcomingSkeleton />}>
            <TodayCalendarCard />
          </Suspense>
        }
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
