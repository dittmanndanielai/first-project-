import { describe, expect, it } from "vitest";
import { openTasksQuery, patchToNotion, taskFromNotion } from "@/features/tasks/notion-map";

// Aufbau entspricht einer echten Antwort von POST /v1/data_sources/{id}/query (API 2025-09-03).
function page(properties: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    object: "page",
    id: "3ed82151-c6cc-8096-b8aa-c31811dfcf34",
    url: "https://www.notion.so/Task-3ed82151c6cc8096b8aac31811dfcf34",
    created_time: "2026-10-11T20:00:00.000Z",
    in_trash: false,
    properties,
    ...extra,
  };
}

const full = {
  Titel: { type: "title", title: [{ plain_text: "Send Weldstone " }, { plain_text: "proposal v2" }] },
  Liste: { type: "select", select: { name: "Heute" } },
  Prio: { type: "select", select: { name: "Hoch" } },
  Status: { type: "select", select: { name: "offen" } },
  Fokus: { type: "checkbox", checkbox: true },
  Datum: { type: "date", date: { start: "2026-10-14", end: null } },
  "Erledigt am": { type: "date", date: null },
  reschedule_count: { type: "number", number: 3 },
  Ziel: { type: "relation", relation: [{ id: "goal-1" }], has_more: false },
  created_by: { type: "select", select: { name: "agent" } },
};

describe("taskFromNotion", () => {
  it("liest alle Felder", () => {
    const t = taskFromNotion(page(full), new Map([["goal-1", "Weldstone"]]));
    expect(t).toMatchObject({
      title: "Send Weldstone proposal v2",
      list: "today",
      priority: "high",
      status: "open",
      focus: true,
      deadline: "2026-10-14",
      doneAt: null,
      postponed: 3,
      goal: { id: "goal-1", title: "Weldstone" },
      createdBy: "agent",
    });
  });

  it("behandelt leere Felder tolerant (Status leer = offen, ohne Liste = später)", () => {
    const t = taskFromNotion(
      page({
        Titel: { title: [{ plain_text: "Alt-Eintrag" }] },
        Liste: { select: null },
        Status: { select: null },
        reschedule_count: { number: null },
        Ziel: { relation: [] },
      }),
    );
    expect(t).toMatchObject({ list: "later", status: "open", priority: null, focus: false, postponed: 0, goal: null });
  });

  it("ignoriert Zeilen ohne Titel und Seiten im Papierkorb", () => {
    expect(taskFromNotion(page({ Titel: { title: [] } }))).toBeNull();
    expect(taskFromNotion(page(full, { in_trash: true }))).toBeNull();
    expect(taskFromNotion({ nonsense: true })).toBeNull();
  });

  it("erkennt erledigt", () => {
    const t = taskFromNotion(
      page({ ...full, Status: { select: { name: "erledigt" } }, "Erledigt am": { date: { start: "2026-10-12" } } }),
    );
    expect(t).toMatchObject({ status: "done", doneAt: "2026-10-12" });
  });
});

describe("patchToNotion", () => {
  it("übersetzt in Notion-Properties mit deutschen Optionsnamen", () => {
    expect(patchToNotion({ status: "done", doneAt: "2026-10-12", list: "week", postponed: 2, focus: false })).toEqual({
      Status: { select: { name: "erledigt" } },
      "Erledigt am": { date: { start: "2026-10-12" } },
      Liste: { select: { name: "Diese Woche" } },
      reschedule_count: { number: 2 },
      Fokus: { checkbox: false },
    });
  });

  it("leert Datum und Prio mit null", () => {
    expect(patchToNotion({ doneAt: null, priority: null })).toEqual({
      "Erledigt am": { date: null },
      Prio: { select: null },
    });
  });
});

describe("openTasksQuery", () => {
  it("filtert offen, leer oder heute erledigt", () => {
    const q = openTasksQuery("2026-10-12");
    expect(q.filter.or).toHaveLength(3);
    expect(q.page_size).toBe(100);
    expect(openTasksQuery("2026-10-12", "abc")).toMatchObject({ start_cursor: "abc" });
  });
});
