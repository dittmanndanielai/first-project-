import { describe, expect, it } from "vitest";
import { interleave, LEARNING_CATEGORIES, LEARNING_SECTIONS, learningToCard, parseLearning, type LearningEntry } from "@/features/discover/learning";
import { LEARNING_CARDS, LEARNING_ENTRIES, REFERENCE_SLUGS } from "@/features/discover/learning-content";

const valid: LearningEntry = {
  slug: "beispiel",
  category: "Mental Models",
  title: "Beispielprinzip",
  lead: "Ein Satz, der das Prinzip in klaren Worten erklärt und auf einen iPhone-Bildschirm passt.",
  sections: LEARNING_SECTIONS.map((s) => ({ ...s, body: "x".repeat(150) })),
  takeaway: "Ein klarer Satz zum Mitnehmen.",
  source: { title: "Buch", author: "Autorin", year: 2001 },
  basis: "primary",
  reviewed: false,
};
const file = (data: unknown, name = "beispiel.json") => [{ file: name, data }];

describe("Learning-Bibliothek im Repo", () => {
  it("enthält 24 gültige Karten, vier pro Kategorie, alle ungeprüft", () => {
    expect(LEARNING_ENTRIES).toHaveLength(24);
    for (const cat of LEARNING_CATEGORIES) expect(LEARNING_ENTRIES.filter((e) => e.category === cat)).toHaveLength(4);
    expect(LEARNING_ENTRIES.every((e) => e.reviewed === false)).toBe(true);
  });

  it("zeigt die sechs Referenz-Karten zuerst und wechselt danach die Kategorien ab", () => {
    expect(LEARNING_CARDS.slice(0, 6).map((c) => c.id.replace("learn:", ""))).toEqual([...REFERENCE_SLUGS]);
    expect(LEARNING_CARDS.slice(0, 6).map((c) => c.category)).toEqual([...LEARNING_CATEGORIES]);
    for (let i = 1; i < LEARNING_CARDS.length; i++) expect(LEARNING_CARDS[i].category).not.toBe(LEARNING_CARDS[i - 1].category);
  });

  it("hat in jeder Karte eine substanzielle Kritik und nur https-Links", () => {
    for (const e of LEARNING_ENTRIES) {
      const critique = e.sections.find((s) => s.kind === "critique");
      expect(critique?.label).toBe("Grenzen & Gegenargumente");
      expect(critique!.body.length).toBeGreaterThan(250);
      if (e.source.url) expect(e.source.url).toMatch(/^https:\/\//);
    }
  });

  it("baut Karten mit Quelle, Basis und Prüfhinweis", () => {
    const card = learningToCard(valid);
    expect(card).toMatchObject({ id: "learn:beispiel", feed: "learning", depth: "full", categories: ["Mental Models"] });
    expect(card.source).toEqual({ name: "Buch (2001)", author: "Autorin", url: undefined, detail: "Basis: Originalwerk · noch nicht geprüft" });
    expect(learningToCard({ ...valid, reviewed: true }).source.detail).toBe("Basis: Originalwerk");
  });
});

describe("parseLearning (Validierung zur Build-Zeit)", () => {
  it("akzeptiert einen gültigen Eintrag", () => {
    expect(parseLearning(file(valid))).toHaveLength(1);
  });

  it("verlangt die Abschnitte in fester Reihenfolge, inklusive Kritik", () => {
    const swapped = { ...valid, sections: [valid.sections[0], valid.sections[2], valid.sections[1], valid.sections[3]] };
    expect(() => parseLearning(file(swapped))).toThrow(/Reihenfolge/);
    expect(() => parseLearning(file({ ...valid, sections: valid.sections.slice(0, 3) }))).toThrow(/sections/);
  });

  it("lehnt zu lange Leads, fremde Kategorien, Zusatzfelder und http-Links ab", () => {
    expect(() => parseLearning(file({ ...valid, lead: "x".repeat(201) }))).toThrow(/lead/);
    expect(() => parseLearning(file({ ...valid, category: "Productivity" }))).toThrow(/category/);
    expect(() => parseLearning(file({ ...valid, chapter: 3 }))).toThrow();
    expect(() => parseLearning(file({ ...valid, source: { ...valid.source, url: "http://example.com" } }))).toThrow(/https/);
  });

  it("prüft Dateiname und doppelte Slugs", () => {
    expect(() => parseLearning(file(valid, "anders.json"))).toThrow(/Dateinamen/);
    expect(() => parseLearning([...file(valid), ...file(valid)])).toThrow(/doppelt/);
  });

  it("verschränkt Kategorien und stellt Referenzen nach vorn", () => {
    const e = (slug: string, category: LearningEntry["category"]) => ({ ...valid, slug, category });
    const out = interleave([e("a2", "Psychology"), e("a1", "Psychology"), e("b1", "Strategy & Power")], ["a1"]);
    expect(out.map((x) => x.slug)).toEqual(["b1", "a1", "a2"]);
  });
});
