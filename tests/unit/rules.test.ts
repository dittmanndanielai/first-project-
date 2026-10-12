import { describe, expect, it } from "vitest";
import {
  deriveToday,
  isStale,
  nextList,
  planComplete,
  planFocus,
  planMove,
  planReopen,
  planReschedule,
  RuleError,
  sortTasks,
} from "@/features/tasks/rules";
import type { Task } from "@/features/tasks/types";

function task(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    url: "u",
    title: "Task",
    list: "today",
    priority: null,
    status: "open",
    focus: false,
    deadline: null,
    doneAt: null,
    postponed: 0,
    goal: null,
    createdBy: "user",
    createdAt: "2026-10-01T08:00:00.000Z",
    ...over,
  };
}

describe("nextList / reschedule", () => {
  it("rückt eine Stufe weiter und bleibt bei later", () => {
    expect(nextList("today")).toBe("week");
    expect(nextList("week")).toBe("later");
    expect(nextList("later")).toBe("later");
  });

  it("erhöht den Zähler nur beim Verschieben in eine spätere Liste (wie SUB_todos_apply)", () => {
    expect(planReschedule(task({ list: "today", postponed: 2 }))).toEqual({ list: "week", postponed: 3 });
    expect(planReschedule(task({ list: "later", postponed: 4 }))).toEqual({});
    expect(planMove(task({ list: "later", postponed: 1 }), "today")).toEqual({ list: "today" });
  });

  it("nimmt Fokus weg, wenn die Aufgabe Heute verlässt", () => {
    expect(planReschedule(task({ focus: true }))).toEqual({ list: "week", postponed: 1, focus: false });
  });
});

describe("Fokus (Top 3)", () => {
  const three = [task({ id: "a", focus: true }), task({ id: "b", focus: true }), task({ id: "c", focus: true })];

  it("erlaubt höchstens drei offene Fokus-Aufgaben", () => {
    const candidate = task({ id: "d" });
    expect(() => planFocus(candidate, true, [...three, candidate])).toThrow(RuleError);
  });

  it("zählt erledigte Fokus-Aufgaben nicht mit", () => {
    const done = [...three.slice(0, 2), task({ id: "c", focus: true, status: "done" })];
    const candidate = task({ id: "d" });
    expect(planFocus(candidate, true, [...done, candidate])).toEqual({ focus: true });
  });

  it("holt die Aufgabe beim Markieren nach Heute", () => {
    const candidate = task({ id: "d", list: "week" });
    expect(planFocus(candidate, true, [candidate])).toEqual({ focus: true, list: "today" });
  });

  it("Abwählen geht immer", () => {
    expect(planFocus(three[0], false, three)).toEqual({ focus: false });
  });
});

describe("erledigen", () => {
  it("setzt Status und Datum absolut (idempotent)", () => {
    expect(planComplete("2026-10-12")).toEqual({ status: "done", doneAt: "2026-10-12" });
    expect(planReopen()).toEqual({ status: "open", doneAt: null });
  });
});

describe("Ableitungen", () => {
  it("markiert ab drei Verschiebungen als stale, aber nur offene", () => {
    expect(isStale(task({ postponed: 3 }))).toBe(true);
    expect(isStale(task({ postponed: 3, status: "done" }))).toBe(false);
    expect(isStale(task({ postponed: 2 }))).toBe(false);
  });

  it("sortiert nach Liste, Prio, Erstellung", () => {
    const sorted = sortTasks([
      task({ id: "w", list: "week", priority: "high" }),
      task({ id: "tl", list: "today", priority: "low" }),
      task({ id: "th", list: "today", priority: "high" }),
      task({ id: "tn", list: "today", priority: null }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["th", "tl", "tn", "w"]);
  });

  it("berechnet Fortschritt über Heute und Fokus", () => {
    const view = deriveToday([
      task({ id: "1", status: "done" }),
      task({ id: "2" }),
      task({ id: "3", list: "week", focus: true }),
      task({ id: "4", list: "later" }),
    ]);
    expect(view.progress).toEqual({ done: 1, total: 3, left: 2, pct: 1 / 3 });
    expect(view.openCount).toEqual({ today: 1, week: 1, later: 1 });
    expect(view.focus.map((t) => t.id)).toEqual(["3"]);
  });
});
