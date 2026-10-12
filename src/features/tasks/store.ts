import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { notion } from "@/lib/notion";
import { TAGS, TTL } from "@/lib/cache-tags";
import { isoDate } from "@/lib/time";
import { mockTasks } from "@/mocks/tasks";
import { goalTitleFromNotion, openTasksQuery, patchToNotion, taskFromNotion } from "./notion-map";
import { applyPatch } from "./rules";
import type { Task, TaskPatch } from "./types";

// Datenzugriff für Aufgaben. Zwei Quellen: Notion (Produktion) und Mock (Entwicklung, Preview).

type QueryResult = { results: unknown[]; has_more: boolean; next_cursor: string | null };

function today() {
  return isoDate(new Date(), env().APP_TIMEZONE);
}

// ---------- Notion ----------

async function goalTitles(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const res = await notion<QueryResult>(`data_sources/${env().NOTION_GOALS_DS_ID}/query`, {
      method: "POST",
      body: { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) },
      cache: { revalidate: TTL.goals, tags: [TAGS.goals] },
    });
    for (const raw of res.results) {
      const entry = goalTitleFromNotion(raw);
      if (entry) map.set(entry[0], entry[1]);
    }
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);
  return map;
}

async function notionList(): Promise<Task[]> {
  const day = today();
  const [goals, pages] = await Promise.all([
    goalTitles().catch(() => new Map<string, string>()), // Goal-Titel sind Zierde, kein Grund zu scheitern
    (async () => {
      const all: unknown[] = [];
      let cursor: string | undefined;
      do {
        const res = await notion<QueryResult>(`data_sources/${env().NOTION_TODOS_DS_ID}/query`, {
          method: "POST",
          body: openTasksQuery(day, cursor),
          cache: { revalidate: TTL.tasks, tags: [TAGS.tasks] },
        });
        all.push(...res.results);
        cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
      } while (cursor);
      return all;
    })(),
  ]);
  return pages.map((p) => taskFromNotion(p, goals)).filter((t): t is Task => t !== null);
}

// ---------- Mock (nur im Speicher, pro Server-Instanz) ----------

let mockState: Task[] | null = null;
const mockTrash = new Map<string, Task>();

function mock(): Task[] {
  if (!mockState) mockState = mockTasks(today());
  return mockState;
}

export function mockAddTask(task: Task) {
  mock().push(task);
}

// ---------- Öffentliche API ----------

/** Alle offenen und heute erledigten Aufgaben. Pro Request nur einmal geladen. */
export const listTasks = cache(async (): Promise<Task[]> => {
  if (env().DATA_SOURCE === "mock") return mock().map((t) => ({ ...t }));
  return notionList();
});

export async function patchTask(id: string, patch: TaskPatch): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  if (env().DATA_SOURCE === "mock") {
    mockState = mock().map((t) => (t.id === id ? applyPatch(t, patch) : t));
    return;
  }
  await notion(`pages/${id}`, { method: "PATCH", body: { properties: patchToNotion(patch) } });
}

export async function trashTask(id: string): Promise<void> {
  if (env().DATA_SOURCE === "mock") {
    const t = mock().find((x) => x.id === id);
    if (t) mockTrash.set(id, t);
    mockState = mock().filter((x) => x.id !== id);
    return;
  }
  await notion(`pages/${id}`, { method: "PATCH", body: { in_trash: true } });
}

export async function restoreTask(id: string): Promise<void> {
  if (env().DATA_SOURCE === "mock") {
    const t = mockTrash.get(id);
    if (t) mock().push(t);
    mockTrash.delete(id);
    return;
  }
  await notion(`pages/${id}`, { method: "PATCH", body: { in_trash: false } });
}

export function todayISO(): string {
  return today();
}
