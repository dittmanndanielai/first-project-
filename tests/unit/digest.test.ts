import { describe, expect, it } from "vitest";
import { archiveUrlFromNotion, recentStoriesQuery, safeUrl, storyFromNotion } from "@/features/digest/notion-map";
import { forYou, isMarketStory, latestEdition, runOf, SECTION_SIZE } from "@/features/digest/rules";
import type { Story } from "@/features/digest/types";
import type { Task } from "@/features/tasks/types";

const TZ = "Europe/Berlin";

// Aufbau wie POST /v1/data_sources/{id}/query (API 2025-09-03) für eine Zeile, die B_news_digest schreibt.
const realRow = {
  object: "page",
  id: "3f882151-c6cc-8190-bcff-d4a6c2d9d4f6",
  created_time: "2026-10-13T06:03:00.000Z",
  last_edited_time: "2026-10-13T06:03:00.000Z",
  parent: {
    type: "data_source_id",
    data_source_id: "42a6a120-423e-4375-8a43-f7d5002a2d11",
    database_id: "150db846-7a31-4a99-9538-20c2d5d20680",
  },
  in_trash: false,
  is_archived: false,
  properties: {
    "Canonical URL": { id: "a1", type: "url", url: "https://www.ft.com/content/9dbd99db?syn-25a6b1a6=1" },
    Kernaussage: {
      id: "a2",
      type: "rich_text",
      rich_text: [{ type: "text", text: { content: "Chinesische Firmen kompensieren Engpässe.", link: null }, plain_text: "Chinesische Firmen kompensieren Engpässe.", href: null }],
    },
    "Source Count": { id: "a3", type: "number", number: 1 },
    "Story ID": { id: "a4", type: "rich_text", rich_text: [{ type: "text", text: { content: "e0714204", link: null }, plain_text: "e0714204", href: null }] },
    Themenfeld: {
      id: "a5",
      type: "multi_select",
      multi_select: [
        { id: "x1", name: "Geopolitik", color: "red" },
        { id: "x2", name: "Wirtschaft", color: "blue" },
      ],
    },
    Datum: { id: "a6", type: "date", date: { start: "2026-10-13", end: null, time_zone: null } },
    Titel: {
      id: "title",
      type: "title",
      title: [{ type: "text", text: { content: "China nutzt Gaming‑GPUs ", link: null }, plain_text: "China nutzt Gaming‑GPUs ", href: null }],
    },
  },
  url: "https://www.notion.so/China-3f882151c6cc8190bcffd4a6c2d9d4f6",
};

describe("storyFromNotion (echte API-Form)", () => {
  it("liest alle Felder und übersetzt Themenfelder", () => {
    expect(storyFromNotion(realRow)).toEqual({
      id: "3f882151-c6cc-8190-bcff-d4a6c2d9d4f6",
      storyId: "e0714204",
      title: "China nutzt Gaming‑GPUs",
      takeaway: "Chinesische Firmen kompensieren Engpässe.",
      date: "2026-10-13",
      topics: ["geopolitics", "economy"],
      sources: 1,
      url: "https://www.ft.com/content/9dbd99db?syn-25a6b1a6=1",
      createdAt: "2026-10-13T06:03:00.000Z",
      // Altzeile: die seit 14.10.2026 geschriebenen Properties fehlen ganz, das ist kein Fehler
      points: [],
      whyRelevant: "",
      outlook: "",
      chance: "",
      impact: null,
      metric: "",
      feedName: "",
    });
  });

  it("toleriert Economist-Zeilen ohne URL und leere Felder", () => {
    const row = {
      ...realRow,
      properties: {
        ...realRow.properties,
        "Canonical URL": { type: "url", url: null },
        "Source Count": { type: "number", number: null },
        Themenfeld: { type: "multi_select", multi_select: [{ name: "Unbekannt" }] },
        Kernaussage: { type: "rich_text", rich_text: [] },
        "Story ID": { type: "rich_text", rich_text: [] },
      },
    };
    expect(storyFromNotion(row)).toMatchObject({ url: null, sources: 1, topics: [], takeaway: "", storyId: realRow.id });
  });

  it("verwirft Zeilen ohne Titel oder Datum und im Papierkorb", () => {
    expect(storyFromNotion({ ...realRow, in_trash: true })).toBeNull();
    expect(storyFromNotion({ ...realRow, properties: { ...realRow.properties, Titel: { title: [] } } })).toBeNull();
    expect(storyFromNotion({ ...realRow, properties: { ...realRow.properties, Datum: { date: null } } })).toBeNull();
    expect(storyFromNotion(null)).toBeNull();
  });

  it("baut den Archiv-Link aus der Datenbank-ID", () => {
    expect(archiveUrlFromNotion(realRow)).toBe("https://www.notion.so/150db8467a314a99953820c2d5d20680");
    expect(archiveUrlFromNotion({ ...realRow, parent: { type: "data_source_id" } })).toBeNull();
  });
});

describe("safeUrl", () => {
  it("lässt nur http(s) durch", () => {
    expect(safeUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("data:text/html,x")).toBeNull();
    expect(safeUrl("kein link")).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});

describe("recentStoriesQuery", () => {
  it("filtert ab Stichtag und sortiert nach Datum, dann Schreibzeit", () => {
    const q = recentStoriesQuery("2026-10-10");
    expect(q.filter).toEqual({ property: "Datum", date: { on_or_after: "2026-10-10" } });
    expect(q.sorts[0]).toEqual({ property: "Datum", direction: "descending" });
    expect(q.sorts[1]).toEqual({ timestamp: "created_time", direction: "ascending" });
    expect(recentStoriesQuery("2026-10-10", "c1")).toMatchObject({ start_cursor: "c1" });
  });
});

function s(n: number, over: Partial<Story> = {}): Story {
  return {
    id: `p${n}`,
    storyId: `s${n}`,
    title: `Story ${n}`,
    takeaway: "",
    date: "2026-10-13",
    topics: ["ai"],
    sources: 1,
    url: null,
    createdAt: "2026-10-13T06:00:00.000Z", // 08:00 Berlin
    points: [],
    whyRelevant: "",
    outlook: "",
    chance: "",
    impact: null,
    metric: "",
    feedName: "",
    ...over,
  };
}
const EVENING = "2026-10-13T15:00:00.000Z"; // 17:00 Berlin

describe("latestEdition", () => {
  it("nimmt den neuesten Tag und dort den Abendlauf", () => {
    const e = latestEdition(
      [s(1, { date: "2026-10-12", createdAt: "2026-10-12T15:00:00.000Z" }), s(2), s(3, { createdAt: EVENING }), s(4, { createdAt: EVENING })],
      TZ,
    );
    expect(e).toMatchObject({ date: "2026-10-13", run: "evening", count: 2, hidden: 0 });
    expect(e?.brief?.lead.id).toBe("p3");
  });

  it("nimmt den Morgenlauf, solange abends noch nichts da ist", () => {
    expect(latestEdition([s(1), s(2)], TZ)).toMatchObject({ run: "morning", count: 2 });
  });

  it("ordnet nach erstem Themenfeld: Wirtschaft/VC in Markets, Rest in Daily Brief", () => {
    const e = latestEdition(
      [s(1, { topics: ["geopolitics", "economy"] }), s(2, { topics: ["economy", "ai"] }), s(3, { topics: ["vc"] }), s(4, { topics: [] })],
      TZ,
    );
    expect(e?.brief?.lead.id).toBe("p1");
    expect(e?.brief?.items.map((i) => i.id)).toEqual(["p4"]);
    expect(e?.markets?.lead.id).toBe("p2");
    expect(e?.markets?.items.map((i) => i.id)).toEqual(["p3"]);
    expect(isMarketStory(s(9, { topics: [] }))).toBe(false);
  });

  it("stellt Stories mit mehr Quellen nach vorn und behält sonst die Reihenfolge", () => {
    const e = latestEdition([s(1), s(2, { sources: 3 }), s(3), s(4, { sources: 3 })], TZ);
    expect([e?.brief?.lead.id, ...(e?.brief?.items.map((i) => i.id) ?? [])]).toEqual(["p2", "p4", "p1", "p3"]);
  });

  it("nimmt bei zwei Läufen am selben Nachmittag nur den jüngsten (n8n schreibt dann neue Story-IDs)", () => {
    const first = Array.from({ length: 7 }, (_, i) => s(i + 1, { createdAt: "2026-10-12T15:02:00.000Z" }));
    const second = Array.from({ length: 8 }, (_, i) => s(i + 11, { createdAt: "2026-10-12T15:57:30.000Z" }));
    const e = latestEdition([...first, ...second].map((x) => ({ ...x, date: "2026-10-12" })), TZ);
    expect(e).toMatchObject({ run: "evening", count: 8, hidden: 0 });
    expect(e?.brief?.lead.id).toBe("p11");
  });

  it("zeigt einen vollen Lauf mit 8 Stories vollständig, auch wenn fast alle in eine Rubrik fallen", () => {
    const e = latestEdition(
      [...Array.from({ length: 6 }, (_, i) => s(i + 1)), s(7, { topics: ["economy"] }), s(8, { topics: ["economy"] })],
      TZ,
    );
    expect(e).toMatchObject({ count: 8, hidden: 0 });
    expect(e?.brief?.items).toHaveLength(5);
    expect(e?.markets?.items).toHaveLength(1);
  });

  it("zählt doppelte Story-IDs nur einmal und meldet, was über die Rubrik hinausgeht", () => {
    const many = Array.from({ length: 9 }, (_, i) => s(i + 1));
    const e = latestEdition([...many, s(20, { storyId: "s1" })], TZ);
    expect(1 + (e?.brief?.items.length ?? 0)).toBe(SECTION_SIZE);
    expect(e).toMatchObject({ count: SECTION_SIZE, hidden: 1, markets: null });
  });

  it("liefert null ohne Stories und trennt Läufe um 14 Uhr Berliner Zeit", () => {
    expect(latestEdition([], TZ)).toBeNull();
    expect(runOf(s(1, { createdAt: "2026-10-13T11:59:00.000Z" }), TZ)).toBe("morning"); // 13:59
    expect(runOf(s(1, { createdAt: "2026-10-13T12:00:00.000Z" }), TZ)).toBe("evening"); // 14:00
  });
});

function t(n: number, over: Partial<Task> = {}): Task {
  return {
    id: `t${n}`,
    url: "",
    title: `Task ${n}`,
    list: "today",
    priority: null,
    status: "open",
    focus: false,
    deadline: null,
    doneAt: null,
    postponed: 0,
    goal: null,
    createdBy: "user",
    createdAt: "2026-10-01T00:00:00.000Z",
    ...over,
  };
}

describe("forYou", () => {
  const today = "2026-10-13";

  it("meldet Verschobenes, Überfälliges, heute Fälliges und offene Top 3", () => {
    const items = forYou(
      [
        t(1, { postponed: 3 }),
        t(2, { postponed: 4 }),
        t(3, { deadline: "2026-10-12" }),
        t(4, { deadline: today, focus: true }),
        t(5, { status: "done", postponed: 5 }),
      ],
      today,
    );
    expect(items.map((i) => i.title)).toEqual([
      "2 tasks are past three postponements",
      "1 task is overdue",
      "1 task is due today",
      "1 Top 3 task still open",
    ]);
    expect(items[0].detail).toBe("Task 1 and Task 2 need a decision.");
  });

  it("erinnert an Top 3, wenn sonst nichts ansteht", () => {
    expect(forYou([t(1)], today)).toEqual([{ title: "No Top 3 set yet", detail: "Star up to three tasks to set your day." }]);
  });

  it("kürzt lange Listen und Titel", () => {
    const long = "A very long task title that keeps going and going beyond the limit";
    const [first] = forYou([t(1, { postponed: 3, title: long }), t(2, { postponed: 3 }), t(3, { postponed: 3 })], today);
    expect(first.detail).toMatch(/^A very long task title that keeps going a…, Task 2 and 1 more need a decision\.$/);
  });
});
