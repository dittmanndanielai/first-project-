"use client";

import { Suspense } from "react";
import { CaptureBar } from "@/features/capture/CaptureBar";
import { TasksProvider } from "@/features/tasks/components/TasksProvider";
import type { Task } from "@/features/tasks/types";
import { FocusCard, MyTasksCard, NeedsAttentionCard, ProgressCard } from "./TaskCards";
import { AssistantCard, LawCard } from "./SideCards";

type Props = {
  tasks: Task[];
  today: string;
  /** Kalender-Karte, serverseitig gerendert (features/calendar). */
  calendar: React.ReactNode;
  lawIndex: number;
};

/** Raster der Today-Seite wie im Design: links Top 3, Needs Attention, Aufgaben; Mitte Capture + Orb; rechts Termine, Fortschritt, Law. */
export function TodayBoard({ tasks, today, calendar, lawIndex }: Props) {
  return (
    <TasksProvider tasks={tasks} today={today}>
      <div className="grid3">
        <div className="col">
          <FocusCard />
          <NeedsAttentionCard />
          <MyTasksCard />
        </div>
        <div className="col col-center">
          <Suspense fallback={null}>
            <CaptureBar />
          </Suspense>
          <AssistantCard />
        </div>
        <div className="col">
          {calendar}
          <ProgressCard />
          <LawCard initialIndex={lawIndex} />
        </div>
      </div>
    </TasksProvider>
  );
}
