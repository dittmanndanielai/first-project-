import { describe, expect, it } from "vitest";
import { recentStoriesQuery, safeUrl, storyFromNotion } from "@/features/digest/notion-map";
import { runOf } from "@/features/digest/rules";
import type { Story } from "@/features/digest/types";

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

describe("runOf", () => {
  it("trennt Morgen- und Abendlauf um 14 Uhr Berliner Zeit", () => {
    expect(runOf(s(1, { createdAt: "2026-10-13T11:59:00.000Z" }), TZ)).toBe("morning"); // 13:59
    expect(runOf(s(1, { createdAt: "2026-10-13T12:00:00.000Z" }), TZ)).toBe("evening"); // 14:00
  });
});
