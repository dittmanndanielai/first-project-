"use client";

import { Suspense } from "react";
import { CaptureBar } from "@/features/capture/CaptureBar";
import { TasksProvider } from "@/features/tasks/components/TasksProvider";
import type { Task } from "@/features/tasks/types";
import type { UpcomingEvent } from "@/features/calendar/upcoming";
import { FocusCard, MyTasksCard, ProgressCard } from "./TaskCards";
import { AssistantCard, InvestmentsTeaser, LawCard, UpcomingCard } from "./SideCards";

type Props = {
  tasks: Task[];
  today: string;
  events: UpcomingEvent[];
  nextIn: number | null;
  calendarConnected: boolean;
  lawIndex: number;
};

/** Raster der Today-Seite wie im Design: links Aufgaben, Mitte Capture + Orb, rechts Termine, Fortschritt, Law. */
export function TodayBoard({ tasks, today, events, nextIn, calendarConnected, lawIndex }: Props) {
  return (
    <TasksProvider tasks={tasks} today={today}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="grid3">
          <div className="col">
            <FocusCard />
            <MyTasksCard />
          </div>
          <div className="col col-center">
            <Suspense fallback={null}>
              <CaptureBar />
            </Suspense>
            <AssistantCard />
          </div>
          <div className="col">
            <UpcomingCard events={events} nextIn={nextIn} connected={calendarConnected} />
            <ProgressCard />
            <LawCard initialIndex={lawIndex} />
          </div>
        </div>
        <InvestmentsTeaser />
      </div>
    </TasksProvider>
  );
}
