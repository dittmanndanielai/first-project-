export type TaskList = "today" | "week" | "later";
export type Priority = "high" | "medium" | "low";
export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  url: string;
  title: string;
  list: TaskList; // Notion „Liste“: Heute | Diese Woche | Broader Timeframe
  priority: Priority | null; // „Prio“
  status: TaskStatus; // „Status“ (leer = offen)
  focus: boolean; // „Fokus“ (Top 3)
  deadline: string | null; // „Datum“
  doneAt: string | null; // „Erledigt am“
  postponed: number; // „reschedule_count“
  goal: { id: string; title: string } | null; // „Ziel“ → Goals
  createdBy: "user" | "agent" | null; // „created_by“
  createdAt: string;
};

/** Änderungen, die die App an einer Aufgabe vornehmen darf. Absolute Werte, keine Toggles. */
export type TaskPatch = Partial<Pick<Task, "list" | "priority" | "status" | "focus" | "doneAt" | "postponed">>;

export const LISTS: readonly TaskList[] = ["today", "week", "later"];
