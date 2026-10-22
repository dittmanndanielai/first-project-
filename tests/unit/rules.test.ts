import { describe, expect, it } from "vitest";
import {
  attentionFor,
  deriveToday,
  FocusFullError,
  isActiveFocus,
  isStale,
  needsAttention,
  nextList,
  openFocusCount,
  planComplete,
  planFocus,
  planMove,
  planReopen,
  planReplaceFocus,
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

  it("meldet ein volles Top 3 als FocusFullError (UI bietet Ersetzen an)", () => {
    const candidate = task({ id: "d" });
    expect(() => planFocus(candidate, true, [...three, candidate])).toThrow(FocusFullError);
  });

  it("zählt nur offene Fokus-Aufgaben auf Heute als aktiv (n8n kann Fokus woanders stehen lassen)", () => {
    const drift = task({ id: "x", focus: true, list: "week" });
    expect(isActiveFocus(drift)).toBe(false);
    expect(openFocusCount([...three.slice(0, 2), drift])).toBe(2);
    const candidate = task({ id: "d" });
    expect(planFocus(candidate, true, [...three.slice(0, 2), drift, candidate])).toEqual({ focus: true });
  });

  it("tauscht eine Priorität: alte frei, neue gesetzt (und nach Heute geholt)", () => {
    const add = task({ id: "d", list: "week" });
    expect(planReplaceFocus(add, three[0], [...three, add])).toEqual({ remove: { focus: false }, add: { focus: true, list: "today" } });
  });

  it("tauscht nur gegen eine aktive Priorität und nie mit sich selbst", () => {
    const add = task({ id: "d" });
    expect(() => planReplaceFocus(add, task({ id: "z" }), [...three, add])).toThrow(RuleError);
    expect(() => planReplaceFocus(three[0], three[0], three)).toThrow(RuleError);
    expect(() => planReplaceFocus(task({ id: "d", status: "done" }), three[0], three)).toThrow(RuleError);
  });

  it("nimmt Aufgaben aus den Top 3, die Heute verlassen", () => {
    expect(planMove(three[0], "week", three)).toEqual({ list: "week", postponed: 1, focus: false });
  });

  it("holt eine Fokus-Aufgabe nach Heute nur mit Fokus zurück, wenn Platz ist", () => {
    const drift = task({ id: "x", focus: true, list: "week" });
    expect(planMove(drift, "today", [three[0], drift])).toEqual({ list: "today" });
    expect(planMove(drift, "today", [...three, drift])).toEqual({ list: "today", focus: false });
  });
});

describe("erledigen", () => {
  it("setzt Status und Datum absolut (idempotent) und gibt den Top-3-Platz frei", () => {
    expect(planComplete("2026-10-12")).toEqual({ status: "done", doneAt: "2026-10-12", focus: false });
    expect(planReopen()).toEqual({ status: "open", doneAt: null });
  });

  it("Undo holt die Aufgabe nur in die Top 3 zurück, wenn Platz ist", () => {
    const t = task({ id: "d", status: "done" });
    const two = [task({ id: "a", focus: true }), task({ id: "b", focus: true })];
    expect(planReopen(t, [...two, t], true)).toEqual({ status: "open", doneAt: null, focus: true });
    expect(planReopen(t, [...two, task({ id: "c", focus: true }), t], true)).toEqual({ status: "open", doneAt: null });
    expect(planReopen(t, [t], false)).toEqual({ status: "open", doneAt: null });
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

  it("berechnet Fortschritt über Heute; Top 3 enthält nur aktive Prioritäten", () => {
    const view = deriveToday([
      task({ id: "1", status: "done", focus: true }),
      task({ id: "2", focus: true }),
      task({ id: "3", list: "week", focus: true }),
      task({ id: "4", list: "later" }),
    ]);
    expect(view.progress).toEqual({ done: 1, total: 2, left: 1, pct: 1 / 2 });
    expect(view.openCount).toEqual({ today: 1, week: 1, later: 1 });
    expect(view.focus.map((t) => t.id)).toEqual(["2"]);
  });
});

describe("Needs attention", () => {
  const today = "2026-10-22";
  const fresh = "2026-10-21T08:00:00.000Z"; // gestern angelegt

  it("meldet überfällige Aufgaben mit Tagen", () => {
    expect(attentionFor(task({ deadline: "2026-10-20", createdAt: fresh }), today)).toMatchObject({ reason: "overdue", label: "2 days overdue", days: 2 });
    expect(attentionFor(task({ deadline: "2026-10-21T10:00:00.000+02:00", createdAt: fresh }), today)).toMatchObject({ label: "1 day overdue" });
  });

  it("meldet Fokus außerhalb von Heute, fällig heute ohne Plan und oft verschoben", () => {
    expect(attentionFor(task({ focus: true, list: "week", createdAt: fresh }), today)?.reason).toBe("focusOffToday");
    expect(attentionFor(task({ deadline: today, list: "week", createdAt: fresh }), today)?.reason).toBe("dueToday");
    expect(attentionFor(task({ deadline: today, list: "today", createdAt: fresh }), today)).toBeNull();
    expect(attentionFor(task({ postponed: 3, list: "later", createdAt: fresh }), today)).toMatchObject({ reason: "postponed", label: "Postponed 3×" });
  });

  it("meldet alte Heute-Aufgaben nach Anlagedatum (Berlin), ab 7 Tagen", () => {
    expect(attentionFor(task({ createdAt: "2026-10-15T08:00:00.000Z" }), today)).toMatchObject({ reason: "aging", days: 7, label: "On Today, open for 7 days" });
    expect(attentionFor(task({ createdAt: "2026-10-15T22:30:00.000Z" }), today)).toBeNull(); // 16.10. 00:30 Berlin = 6 Tage
    expect(attentionFor(task({ list: "week", createdAt: "2026-09-01T08:00:00.000Z" }), today)).toBeNull();
  });

  it("ignoriert Erledigtes und aktive Top 3", () => {
    expect(attentionFor(task({ status: "done", deadline: "2026-10-01" }), today)).toBeNull();
    expect(attentionFor(task({ focus: true, deadline: "2026-10-01" }), today)).toBeNull();
  });

  it("zeigt höchstens drei, dringendster Grund und größte Zahl zuerst", () => {
    const { items, total } = needsAttention(
      [
        task({ id: "age", createdAt: "2026-09-01T08:00:00.000Z" }),
        task({ id: "od1", deadline: "2026-10-21", createdAt: fresh }),
        task({ id: "od5", deadline: "2026-10-17", list: "week", createdAt: fresh }),
        task({ id: "post", postponed: 4, list: "later", createdAt: fresh }),
        task({ id: "ok", createdAt: fresh }),
      ],
      today,
    );
    expect(items.map((i) => i.task.id)).toEqual(["od5", "od1", "post"]);
    expect(total).toBe(4);
  });
});
