"use client";

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

/**
 * Today in drei ausgewogenen Spalten: links Entscheidungen (Top 3, Needs attention), Mitte Eingabe und Arbeit
 * (Assistant mit Quick Capture, My Tasks), rechts Kontext (Termine, Fortschritt, Law). Spalten wachsen nur mit ihrem
 * Inhalt. Unter 1180 px eine Spalte in der Reihenfolge der CSS-Klassen `m-*`.
 */
export function TodayBoard({ tasks, today, calendar, lawIndex }: Props) {
  return (
    <TasksProvider tasks={tasks} today={today}>
      <div className="grid3">
        <div className="col">
          <FocusCard />
          <NeedsAttentionCard />
        </div>
        <div className="col col-center">
          <AssistantCard />
          <MyTasksCard />
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
