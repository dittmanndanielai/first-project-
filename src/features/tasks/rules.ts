import { daysBetween, isoDate } from "@/lib/time";
import { LISTS, type Task, type TaskList, type TaskPatch } from "./types";

// Reine Geschäftsregeln ohne I/O. Gleiche Semantik wie SUB_todos_apply in n8n
// (Zähler steigt nur beim Verschieben in eine spätere Liste). Fokus kennt n8n nicht (F1/F2):
// deshalb zählt als aktive Top-3-Priorität nur, was offen UND auf Heute ist.

export const FOCUS_LIMIT = 3;
export const STALE_AFTER = 3;
/** Ab so vielen Tagen seit Anlage gilt eine offene Heute-Aufgabe als liegen geblieben. */
export const AGING_DAYS = 7;

export class RuleError extends Error {}
/** Top 3 ist voll: die UI bietet dann „Ersetzen“ an statt nur eine Meldung. */
export class FocusFullError extends RuleError {}

const rank = (l: TaskList) => LISTS.indexOf(l);

export function nextList(list: TaskList): TaskList {
  return list === "today" ? "week" : "later";
}

/** Erledigen nimmt die Aufgabe aus den Top 3 und gibt den Platz frei. */
export function planComplete(today: string): TaskPatch {
  return { status: "done", doneAt: today, focus: false };
}

/** Wieder öffnen. `restoreFocus` (Undo direkt nach dem Erledigen) holt sie zurück in die Top 3, wenn Platz ist. */
export function planReopen(task?: Task, all: Task[] = [], restoreFocus = false): TaskPatch {
  const patch: TaskPatch = { status: "open", doneAt: null };
  if (restoreFocus && task && task.list === "today" && openFocusCount(all, task.id) < FOCUS_LIMIT) patch.focus = true;
  return patch;
}

/** Liste wechseln. Wer Heute verlässt, verliert den Top-3-Platz; wer nach Heute kommt, behält ihn nur, wenn Platz ist. */
export function planMove(task: Task, to: TaskList, all: Task[] = []): TaskPatch {
  if (to === task.list) return {};
  const patch: TaskPatch = { list: to };
  if (rank(to) > rank(task.list)) patch.postponed = task.postponed + 1;
  if (task.focus && (to !== "today" || openFocusCount(all, task.id) >= FOCUS_LIMIT)) patch.focus = false;
  return patch;
}

export function planReschedule(task: Task): TaskPatch {
  return planMove(task, nextList(task.list));
}

/** Aktive Top-3-Priorität: markiert, offen und auf Heute. */
export function isActiveFocus(task: Task): boolean {
  return task.focus && task.status === "open" && task.list === "today";
}

export function openFocusCount(tasks: Task[], exceptId?: string): number {
  return tasks.filter((t) => isActiveFocus(t) && t.id !== exceptId).length;
}

/** In die Top 3 aufnehmen (holt die Aufgabe nach Heute) oder herausnehmen. */
export function planFocus(task: Task, on: boolean, all: Task[]): TaskPatch {
  if (!on) return { focus: false };
  if (task.status === "done") throw new RuleError("Completed tasks can't be in Top 3");
  if (openFocusCount(all, task.id) >= FOCUS_LIMIT) throw new FocusFullError("Top 3 is full");
  return task.list === "today" ? { focus: true } : { focus: true, list: "today" };
}

/** Eine aktive Priorität gegen eine andere Aufgabe tauschen. Reihenfolge beim Schreiben: erst `remove`, dann `add`. */
export function planReplaceFocus(add: Task, remove: Task, all: Task[]): { remove: TaskPatch; add: TaskPatch } {
  if (add.id === remove.id) throw new RuleError("Pick a different task");
  if (!isActiveFocus(remove)) throw new RuleError("That task is no longer in Top 3");
  const freed = all.map((t) => (t.id === remove.id ? { ...t, focus: false } : t));
  return { remove: { focus: false }, add: planFocus(add, true, freed) };
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
  const relevant = tasks.filter((t) => t.list === "today");
  const done = relevant.filter((t) => t.status === "done").length;
  const total = relevant.length;
  return {
    focus: sortTasks(tasks.filter(isActiveFocus)),
    byList,
    openCount,
    progress: { done, total, left: total - done, pct: total ? done / total : 0 },
  };
}

// ---------- Needs Attention: Aufgaben, die eine Entscheidung brauchen ----------

export type AttentionReason = "overdue" | "focusOffToday" | "dueToday" | "postponed" | "aging";

export type AttentionItem = { task: Task; reason: AttentionReason; label: string; days: number };

const REASON_RANK: Record<AttentionReason, number> = { overdue: 0, focusOffToday: 1, dueToday: 2, postponed: 3, aging: 4 };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Stärkster Grund für eine Entscheidung, sonst null. Nur echte Daten: Deadline, Anlage, Verschiebungen, Top-3-Status. */
export function attentionFor(task: Task, today: string): AttentionItem | null {
  if (task.status !== "open" || isActiveFocus(task)) return null; // aktive Top 3 sind bereits entschieden
  const due = task.deadline ? daysBetween(today, task.deadline) : null;
  if (due !== null && due < 0) return { task, reason: "overdue", label: `${plural(-due, "day")} overdue`, days: -due };
  if (task.focus) return { task, reason: "focusOffToday", label: "Marked Top 3, but not on Today", days: 0 };
  if (due === 0 && task.list !== "today") return { task, reason: "dueToday", label: "Due today, not on Today", days: 0 };
  if (task.postponed >= STALE_AFTER) return { task, reason: "postponed", label: `Postponed ${task.postponed}×`, days: task.postponed };
  // Wie lange eine Aufgabe schon auf Heute liegt, speichert Notion nicht. Ehrlich ist nur das Alter seit der Anlage.
  const age = daysBetween(isoDate(new Date(task.createdAt)), today);
  if (task.list === "today" && age >= AGING_DAYS) return { task, reason: "aging", label: `On Today, open for ${age} days`, days: age };
  return null;
}

/** Höchstens `limit` Aufgaben, wichtigster Grund zuerst, innerhalb eines Grundes die größte Zahl zuerst. */
export function needsAttention(tasks: Task[], today: string, limit = 3): { items: AttentionItem[]; total: number } {
  const all = tasks
    .map((t) => attentionFor(t, today))
    .filter((a): a is AttentionItem => a !== null)
    .sort((a, b) => REASON_RANK[a.reason] - REASON_RANK[b.reason] || b.days - a.days || a.task.createdAt.localeCompare(b.task.createdAt));
  return { items: all.slice(0, limit), total: all.length };
}

export type AttentionAction = "done" | "doToday" | "top3" | "unstar" | "thisWeek" | "later";

/**
 * Feste Reihenfolge der Entscheidungen (Primär, Sekundär, optional Aufschieben):
 * auf Heute → Done, Top 3; nicht auf Heute → Do today, Done. Aufschieben nur bei liegen gebliebenen
 * (This week) und oft verschobenen Aufgaben (Later). Top 3 außerhalb von Heute → Do today, Remove from Top 3.
 */
export function attentionActions(item: AttentionItem): AttentionAction[] {
  const { task, reason } = item;
  if (reason === "focusOffToday") return ["doToday", "unstar"];
  const base: AttentionAction[] = task.list === "today" ? ["done", "top3"] : ["doToday", "done"];
  if (reason === "aging") return [...base, "thisWeek"];
  if (reason === "postponed" && task.list !== "later") return [...base, "later"];
  return base;
}
