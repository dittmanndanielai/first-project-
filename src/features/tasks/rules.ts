import { LISTS, type Task, type TaskList, type TaskPatch } from "./types";

// Reine Geschäftsregeln ohne I/O. Gleiche Semantik wie SUB_todos_apply in n8n
// (Zähler steigt nur beim Verschieben in eine spätere Liste).

export const FOCUS_LIMIT = 3;
export const STALE_AFTER = 3;

export class RuleError extends Error {}

const rank = (l: TaskList) => LISTS.indexOf(l);

export function nextList(list: TaskList): TaskList {
  return list === "today" ? "week" : "later";
}

export function planComplete(today: string): TaskPatch {
  return { status: "done", doneAt: today };
}

export function planReopen(): TaskPatch {
  return { status: "open", doneAt: null };
}

export function planMove(task: Task, to: TaskList): TaskPatch {
  if (to === task.list) return {};
  const patch: TaskPatch = { list: to };
  if (rank(to) > rank(task.list)) patch.postponed = task.postponed + 1;
  if (to !== "today" && task.focus) patch.focus = false;
  return patch;
}

export function planReschedule(task: Task): TaskPatch {
  return planMove(task, nextList(task.list));
}

export function openFocusCount(tasks: Task[], exceptId?: string): number {
  return tasks.filter((t) => t.focus && t.status === "open" && t.id !== exceptId).length;
}

export function planFocus(task: Task, on: boolean, all: Task[]): TaskPatch {
  if (!on) return { focus: false };
  if (task.status === "done") throw new RuleError("Completed tasks can't be in Top 3");
  if (openFocusCount(all, task.id) >= FOCUS_LIMIT) throw new RuleError("Top 3 is full — unstar one first");
  return task.list === "today" ? { focus: true } : { focus: true, list: "today" };
}

export function isStale(task: Task): boolean {
  return task.status === "open" && task.postponed >= STALE_AFTER;
}

/** Wendet einen Patch lokal an (für optimistische UI und den Mock-Store). */
export function applyPatch(task: Task, patch: TaskPatch): Task {
  return { ...task, ...patch };
}

const PRIO_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Sortierung wie SUB_todos: Liste › Prio › Erstellung. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) =>
      rank(a.list) - rank(b.list) ||
      (PRIO_ORDER[a.priority ?? ""] ?? 3) - (PRIO_ORDER[b.priority ?? ""] ?? 3) ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

export type TodayView = {
  focus: Task[];
  byList: Record<TaskList, Task[]>;
  openCount: Record<TaskList, number>;
  progress: { done: number; total: number; left: number; pct: number };
};

/** Alles, was Today, Tasks, Badge und Kopfzeile brauchen, aus einer einzigen Liste. */
export function deriveToday(tasks: Task[]): TodayView {
  const byList: Record<TaskList, Task[]> = { today: [], week: [], later: [] };
  for (const t of sortTasks(tasks)) byList[t.list].push(t);
  const openCount = {
    today: byList.today.filter((t) => t.status === "open").length,
    week: byList.week.filter((t) => t.status === "open").length,
    later: byList.later.filter((t) => t.status === "open").length,
  };
  const relevant = tasks.filter((t) => t.list === "today" || t.focus);
  const done = relevant.filter((t) => t.status === "done").length;
  const total = relevant.length;
  return {
    focus: sortTasks(tasks.filter((t) => t.focus)),
    byList,
    openCount,
    progress: { done, total, left: total - done, pct: total ? done / total : 0 },
  };
}
