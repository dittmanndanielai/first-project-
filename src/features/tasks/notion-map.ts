import { z } from "zod";
import type { Priority, Task, TaskList, TaskPatch } from "./types";

// EINZIGE Stelle mit Notion-Property-Namen der TODOS-Datenbank.
// Vertrag mit n8n (SUB_todos, D_todo_capture, D_daily_todo_call): docs/notion-contract.md

export const PROP = {
  title: "Titel",
  list: "Liste",
  priority: "Prio",
  status: "Status",
  focus: "Fokus",
  deadline: "Datum",
  doneAt: "Erledigt am",
  postponed: "reschedule_count",
  goal: "Ziel",
  createdBy: "created_by",
} as const;

const LIST_TO_NOTION: Record<TaskList, string> = { today: "Heute", week: "Diese Woche", later: "Broader Timeframe" };
const LIST_FROM_NOTION: Record<string, TaskList> = { Heute: "today", "Diese Woche": "week", "Broader Timeframe": "later" };
const PRIO_TO_NOTION: Record<Priority, string> = { high: "Hoch", medium: "Mittel", low: "Niedrig" };
const PRIO_FROM_NOTION: Record<string, Priority> = { Hoch: "high", Mittel: "medium", Niedrig: "low" };

// Tolerantes Parsing: unbekannte oder fehlende Werte fallen auf Defaults zurück, statt die Liste zu sprengen.
const select = z.object({ select: z.object({ name: z.string() }).nullable() }).partial();
const date = z.object({ date: z.object({ start: z.string() }).nullable() }).partial();
const page = z.object({
  id: z.string(),
  url: z.string(),
  created_time: z.string(),
  in_trash: z.boolean().optional(),
  properties: z.record(z.string(), z.unknown()),
});

export type NotionPage = z.infer<typeof page>;

function prop<T extends z.ZodType>(props: Record<string, unknown>, name: string, schema: T): z.infer<T> | undefined {
  const r = schema.safeParse(props[name]);
  return r.success ? r.data : undefined;
}

function plainText(value: unknown): string {
  const parsed = z.object({ title: z.array(z.object({ plain_text: z.string() })) }).safeParse(value);
  return parsed.success ? parsed.data.title.map((t) => t.plain_text).join("").trim() : "";
}

export function taskFromNotion(raw: unknown, goalTitles: Map<string, string> = new Map()): Task | null {
  const parsed = page.safeParse(raw);
  if (!parsed.success || parsed.data.in_trash) return null;
  const { id, url, created_time, properties: p } = parsed.data;

  const title = plainText(p[PROP.title]);
  if (!title) return null; // leere Zeilen ignoriert auch SUB_todos

  const listName = prop(p, PROP.list, select)?.select?.name;
  const prioName = prop(p, PROP.priority, select)?.select?.name;
  const statusName = prop(p, PROP.status, select)?.select?.name;
  const createdBy = prop(p, PROP.createdBy, select)?.select?.name;
  const focus = prop(p, PROP.focus, z.object({ checkbox: z.boolean() }))?.checkbox ?? false;
  const postponed = prop(p, PROP.postponed, z.object({ number: z.number().nullable() }))?.number ?? 0;
  const goalId = prop(p, PROP.goal, z.object({ relation: z.array(z.object({ id: z.string() })) }))?.relation[0]?.id;

  return {
    id,
    url,
    title,
    list: (listName && LIST_FROM_NOTION[listName]) || "later",
    priority: (prioName && PRIO_FROM_NOTION[prioName]) || null,
    status: statusName === "erledigt" ? "done" : "open",
    focus,
    deadline: prop(p, PROP.deadline, date)?.date?.start ?? null,
    doneAt: prop(p, PROP.doneAt, date)?.date?.start ?? null,
    postponed,
    goal: goalId ? { id: goalId, title: goalTitles.get(goalId) ?? "" } : null,
    createdBy: createdBy === "user" || createdBy === "agent" ? createdBy : null,
    createdAt: created_time,
  };
}

export function patchToNotion(patch: TaskPatch): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  if (patch.list !== undefined) props[PROP.list] = { select: { name: LIST_TO_NOTION[patch.list] } };
  if (patch.priority !== undefined)
    props[PROP.priority] = { select: patch.priority ? { name: PRIO_TO_NOTION[patch.priority] } : null };
  if (patch.status !== undefined)
    props[PROP.status] = { select: { name: patch.status === "done" ? "erledigt" : "offen" } };
  if (patch.focus !== undefined) props[PROP.focus] = { checkbox: patch.focus };
  if (patch.doneAt !== undefined) props[PROP.doneAt] = { date: patch.doneAt ? { start: patch.doneAt } : null };
  if (patch.postponed !== undefined) props[PROP.postponed] = { number: patch.postponed };
  return props;
}

/** Offene Aufgaben plus heute erledigte (für den Fortschrittsring). Status leer zählt als offen. */
export function openTasksQuery(today: string, cursor?: string) {
  return {
    filter: {
      or: [
        { property: PROP.status, select: { does_not_equal: "erledigt" } },
        { property: PROP.status, select: { is_empty: true } },
        { property: PROP.doneAt, date: { on_or_after: today } },
      ],
    },
    sorts: [{ timestamp: "created_time", direction: "ascending" }],
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  };
}

export function goalTitleFromNotion(raw: unknown): [string, string] | null {
  const parsed = page.safeParse(raw);
  if (!parsed.success) return null;
  const title = plainText(parsed.data.properties["Titel"]);
  return title ? [parsed.data.id, title] : null;
}
