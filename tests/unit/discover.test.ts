import { describe, expect, it } from "vitest";
import { storyFromNotion } from "@/features/digest/notion-map";
import { runOf } from "@/features/digest/rules";
import type { Story } from "@/features/digest/types";
import { dedupeStories, orderStories, parseMetric, shorten, storyToCard } from "@/features/discover/intelligence";
import { categoriesOf, filterCards, nextDigestLabel, STORY_ID } from "@/features/discover/rules";
import { germanDayLabel } from "@/lib/time";

const TZ = "Europe/Berlin";
const rt = (s: string) => ({ type: "rich_text", rich_text: s ? [{ type: "text", text: { content: s, link: null }, plain_text: s, href: null }] : [] });

// Aufbau wie POST /v1/data_sources/{id}/query (API 2025-09-03); Werte nach dem Muster von Story b1e6de99 (13.10.2026).
const fullRow = {
  object: "page",
  id: "3f882151-c6cc-8134-9930-e6929c3e624d",
  created_time: "2026-10-13T15:03:34.000Z",
  parent: { type: "data_source_id", data_source_id: "42a6a120-423e-4375-8a43-f7d5002a2d11", database_id: "150db846-7a31-4a99-9538-20c2d5d20680" },
  in_trash: false,
  properties: {
    Titel: { id: "title", type: "title", title: [{ type: "text", text: { content: "Kleine Modelle replizieren sich", link: null }, plain_text: "Kleine Modelle replizieren sich", href: null }] },
    Kernaussage: rt("Kleine Modelle könnten sich bald autonom über schlecht gesicherte Geräte verbreiten."),
    Datum: { type: "date", date: { start: "2026-10-13", end: null, time_zone: null } },
    "Canonical URL": { type: "url", url: "https://the-decoder.com/example/" },
    Themenfeld: { type: "multi_select", multi_select: [{ id: "a", name: "KI", color: "default" }, { id: "b", name: "Wirtschaft", color: "default" }] },
    "Story ID": rt("b1e6de99"),
    "Source Count": { type: "number", number: 1 },
    Kernpunkte: rt("Punkt eins.\n• Punkt zwei.\n\n- Punkt drei.\nPunkt vier."),
    "Warum relevant": rt("Das Angriffsbild verschiebt sich zu Endgeräten."),
    "Was folgen könnte": rt("Indikator: Berichte über modellgetriebene Botnets."),
    Chance: rt("SDKs für Integritätsprüfung auf Geräten."),
    Impact: { type: "select", select: { id: "x", name: "Hoch", color: "red" } },
    Kennzahl: rt("28–150 h – Setupzeit pro Gerät"),
    Quelle: rt("The Decoder"),
  },
};

// Altzeile vor 14.10.2026: die neuen Properties fehlen ganz.
const NEW_FIELDS = ["Kernpunkte", "Warum relevant", "Was folgen könnte", "Chance", "Impact", "Kennzahl", "Quelle"];
const oldProps = Object.fromEntries(Object.entries(fullRow.properties).filter(([k]) => !NEW_FIELDS.includes(k)));
const oldRow = { ...fullRow, id: "old-1", properties: { ...oldProps, "Story ID": rt("587ab8f2") } };

function story(over: Partial<Story> = {}): Story {
  return {
    id: "p1", storyId: "a1b2c3d4", title: "Titel", takeaway: "Kernaussage.", date: "2026-10-13", topics: ["ai"], sources: 1,
    url: "https://www.example.com/a", createdAt: "2026-10-13T06:00:00.000Z",
    points: [], whyRelevant: "", outlook: "", chance: "", impact: null, metric: "", feedName: "", ...over,
  };
}

describe("Intelligence-Adapter", () => {
  it("bildet eine volle Seite vollständig ab", () => {
    const s = storyFromNotion(fullRow)!;
    expect(s).toMatchObject({ points: ["Punkt eins.", "Punkt zwei.", "Punkt drei.", "Punkt vier."], impact: "high", feedName: "The Decoder" });
    const card = storyToCard(s);
    expect(card).toMatchObject({
      id: "digest:b1e6de99",
      feed: "intelligence",
      category: "AI & Technology",
      categories: ["AI & Technology", "Business & Markets"],
      depth: "full",
      points: ["Punkt eins.", "Punkt zwei.", "Punkt drei."],
      stat: { value: "28–150 h", label: "Setupzeit pro Gerät" },
      impact: "high",
      source: { name: "The Decoder", url: "https://the-decoder.com/example/" },
      date: "2026-10-13",
      storyId: "b1e6de99",
    });
    expect(card.sections.map((x) => [x.label, x.kind])).toEqual([
      ["Kernpunkte", "fact"],
      ["Warum relevant", "analysis"],
      ["Was folgen könnte", "outlook"],
      ["Chance für dich", "analysis"],
    ]);
    expect(card.sections[0].body.split("\n")).toHaveLength(4); // alle Punkte in „Mehr lesen“
  });

  it("macht aus einer Altseite ohne neue Felder eine Thin-Card, ohne zu werfen", () => {
    const s = storyFromNotion(oldRow)!;
    expect(s).toMatchObject({ points: [], whyRelevant: "", impact: null, metric: "", feedName: "" });
    const card = storyToCard(s);
    expect(card).toMatchObject({ depth: "thin", points: [], sections: [], stat: undefined, impact: undefined });
    expect(card.source.name).toBe("the-decoder.com"); // Hostname, wenn „Quelle“ fehlt
  });

  it("zeigt Economist-Stories ohne URL mit Quellennamen und ohne Link", () => {
    const card = storyToCard(story({ storyId: "economist:2026-10-13:3", url: null }));
    expect(card.source).toEqual({ name: "The Economist", url: undefined, detail: undefined });
    expect(card.id).toBe("digest:economist:2026-10-13:3");
    expect(storyToCard(story({ storyId: "economist:2026-10-13:3", url: null, feedName: "The Economist" })).source.name).toBe("The Economist");
  });

  it("nimmt bei mehreren Themenfeldern das erste als Kategorie, der Filter findet alle", () => {
    const cards = [storyToCard(story({ topics: ["geopolitics", "economy"] })), storyToCard(story({ storyId: "b2", topics: ["vc"] }))];
    expect(cards[0].category).toBe("Geopolitics");
    expect(filterCards(cards, "Business & Markets")).toHaveLength(1);
    expect(filterCards(cards, "Business & Markets")[0].category).toBe("Business & Markets"); // Eyebrow folgt dem Filter
    expect(filterCards(cards, "Geopolitics")[0]).toBe(cards[0]); // Hauptkategorie: Karte unverändert
    expect(filterCards(cards, "Opportunities")[0].storyId).toBe("b2");
    expect(filterCards(cards, null)).toHaveLength(2);
    expect(categoriesOf(cards)).toEqual(["Geopolitics", "Business & Markets", "Opportunities"]);
    expect(storyToCard(story({ topics: [] })).categories).toEqual(["Briefing"]);
  });

  it("trennt die Kennzahl am ersten „ – “ und verwirft alles ohne Trenner", () => {
    expect(parseMetric("28–150 h – Setupzeit pro Gerät")).toEqual({ value: "28–150 h", label: "Setupzeit pro Gerät" });
    expect(parseMetric("3,2 % – Inflation – Eurozone")).toEqual({ value: "3,2 %", label: "Inflation – Eurozone" });
    expect(parseMetric("40 %")).toBeUndefined();
    expect(parseMetric("40-50 Mrd")).toBeUndefined();
    expect(parseMetric(" – Label")).toBeUndefined();
    expect(parseMetric("")).toBeUndefined();
  });

  it("kürzt lange Kernaussagen an einer Wortgrenze", () => {
    const long = "Wort ".repeat(80).trim();
    const out = shorten(long);
    expect(out.length).toBeLessThanOrEqual(240);
    expect(out.endsWith("Wort…")).toBe(true);
    expect(shorten("kurz")).toBe("kurz");
  });
});

describe("Reihenfolge des Intelligence-Feeds", () => {
  const order = (stories: Story[]) => orderStories(stories, (s) => runOf(s, TZ)).map((s) => s.storyId);
  const full = { whyRelevant: "x" };

  it("sortiert nach Tag absteigend, im Tag volle Karten nach Impact, Thin-Cards ans Ende", () => {
    expect(
      order([
        story({ storyId: "old", date: "2026-10-12", ...full, impact: "high" }),
        story({ storyId: "thin", date: "2026-10-13" }),
        story({ storyId: "low", date: "2026-10-13", ...full, impact: "low" }),
        story({ storyId: "none", date: "2026-10-13", ...full }),
        story({ storyId: "high", date: "2026-10-13", ...full, impact: "high" }),
        story({ storyId: "mid", date: "2026-10-13", ...full, impact: "medium" }),
      ]),
    ).toEqual(["high", "mid", "low", "none", "thin", "old"]);
  });

  it("zeigt bei gleichem Impact den Abendlauf zuerst, im Lauf die Reihenfolge der Mail", () => {
    expect(
      order([
        story({ storyId: "m1", createdAt: "2026-10-13T06:03:00.000Z" }),
        story({ storyId: "m2", createdAt: "2026-10-13T06:03:05.000Z" }),
        story({ storyId: "e1", createdAt: "2026-10-13T15:03:00.000Z" }),
      ]),
    ).toEqual(["e1", "m1", "m2"]);
  });

  it("hält pro Story ID eine Zeile: die vollständigere, sonst die jüngere", () => {
    const a = story({ id: "a", storyId: "economist:2026-10-13:1", createdAt: "2026-10-13T06:00:00.000Z", ...full });
    const b = story({ id: "b", storyId: "economist:2026-10-13:1", createdAt: "2026-10-13T15:00:00.000Z" });
    const c = story({ id: "c", storyId: "s2", createdAt: "2026-10-13T06:00:00.000Z" });
    const d = story({ id: "d", storyId: "s2", createdAt: "2026-10-13T15:00:00.000Z" });
    expect(dedupeStories([a, b, c, d]).map((s) => s.id)).toEqual(["a", "d"]);
  });
});

describe("Discover-Regeln", () => {
  it("leitet den nächsten Digest aus der Uhrzeit in Berlin ab", () => {
    expect(nextDigestLabel(new Date("2026-10-14T05:59:00Z"), TZ)).toBe("heute um 08:00"); // 07:59
    expect(nextDigestLabel(new Date("2026-10-14T06:00:00Z"), TZ)).toBe("heute um 17:00"); // 08:00
    expect(nextDigestLabel(new Date("2026-10-14T14:59:00Z"), TZ)).toBe("heute um 17:00"); // 16:59
    expect(nextDigestLabel(new Date("2026-10-14T15:00:00Z"), TZ)).toBe("morgen um 08:00"); // 17:00
    expect(nextDigestLabel(new Date("2026-10-14T22:30:00Z"), TZ)).toBe("heute um 08:00"); // 00:30 am 15.10.
  });

  it("akzeptiert nur Story IDs aus n8n", () => {
    for (const ok of ["b1e6de99", "587ab8", "a1b2c3d", "economist:2026-10-13:1", "economist:2026-10-13:12"]) expect(STORY_ID.test(ok)).toBe(true);
    for (const bad of ["B1E6DE99", "abc12", "b1e6de99a", "economist:2026-10-13", "economist:2026-10-13:123", "x; drop", ""]) expect(STORY_ID.test(bad)).toBe(false);
  });

  it("schreibt Digest-Tage als deutsches Kurzlabel", () => {
    expect(germanDayLabel("2026-10-13")).toBe("Di. 13. Okt.");
    expect(germanDayLabel("2026-05-05")).toBe("Di. 5. Mai");
  });
});
