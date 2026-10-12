import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { logError } from "@/lib/log";
import { dateLabel, isoDate } from "@/lib/time";
import { HeaderSkeleton, PageHeader } from "@/features/shell/PageHeader";
import { TasksBoard } from "@/features/tasks/components/TasksBoard";
import { listTasks } from "@/features/tasks/store";
import type { Task } from "@/features/tasks/types";

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <>
          <HeaderSkeleton />
          <div className="card skeleton" style={{ height: 140 }} />
          <div className="cols3">
            <div className="card skeleton" style={{ height: 300 }} />
            <div className="card skeleton" style={{ height: 300 }} />
            <div className="card skeleton" style={{ height: 300 }} />
          </div>
        </>
      }
    >
      <Tasks />
    </Suspense>
  );
}

async function Tasks() {
  await requireSession();
  const tz = env().APP_TIMEZONE;
  const now = new Date();
  let tasks: Task[] = [];
  let synced = true;
  try {
    tasks = await listTasks();
  } catch (err) {
    synced = false;
    logError("tasks.list", err);
  }
  return (
    <>
      <PageHeader dateLabel={dateLabel(now, tz)} title="Tasks" synced={synced} />
      <TasksBoard tasks={tasks} today={isoDate(now, tz)} />
    </>
  );
}
