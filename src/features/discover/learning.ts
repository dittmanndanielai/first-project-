import { z } from "zod";
import type { DiscoverCard, SectionKind } from "./types";

// Learning-Bibliothek: kuratierte, zeitlose Karten im Repo (content/learning/*.json), versioniert und per Diff prüfbar.
// Validierung beim Laden des Moduls: ein Fehler bricht `next build` ab. Prüfliste für Daniel: docs/learning-review.md

export const LEARNING_CATEGORIES = [
  "Strategy & Power",
  "Psychology",
  "Business & Entrepreneurship",
  "Finance & Investing",
  "Mental Models",
  "Philosophy & Personal Development",
] as const;

export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];

/** Pflichtreihenfolge der Abschnitte; „Grenzen & Gegenargumente“ ist Pflicht. */
export const LEARNING_SECTIONS: readonly { label: string; kind: SectionKind }[] = [
  { label: "Erklärung", kind: "fact" },
  { label: "Warum es wirkt", kind: "analysis" },
  { label: "Anwendung", kind: "application" },
  { label: "Grenzen & Gegenargumente", kind: "critique" },
];

export const LEAD_MAX_LEARNING = 200;

const BASIS_LABEL = {
  primary: "Originalwerk",
  secondary: "Sekundärquelle",
  "established-concept": "etabliertes Konzept",
} as const;

const httpsUrl = z.url().refine((u) => u.startsWith("https://"), "nur https");

export const learningEntry = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    category: z.enum(LEARNING_CATEGORIES),
    title: z.string().min(3).max(60),
    lead: z.string().min(40).max(LEAD_MAX_LEARNING),
    sections: z
      .array(z.object({ label: z.string(), body: z.string().min(120).max(900), kind: z.enum(["fact", "analysis", "outlook", "critique", "application"]) }).strict())
      .length(LEARNING_SECTIONS.length)
      .refine((s) => s.every((sec, i) => sec.label === LEARNING_SECTIONS[i].label && sec.kind === LEARNING_SECTIONS[i].kind), {
        message: `Abschnitte in dieser Reihenfolge: ${LEARNING_SECTIONS.map((s) => s.label).join(" · ")}`,
      }),
    takeaway: z.string().min(20).max(160),
    source: z
      .object({
        title: z.string().min(2),
        author: z.string().min(2),
        year: z.number().int().min(1).max(2100).optional(),
        detail: z.string().optional(),
        url: httpsUrl.optional(),
      })
      .strict(),
    basis: z.enum(["primary", "secondary", "established-concept"]),
    reviewed: z.boolean(),
  })
  .strict();

export type LearningEntry = z.infer<typeof learningEntry>;

/** Prüft alle Einträge; wirft mit Slug und Feld, damit der Build-Fehler direkt zur Datei führt. */
export function parseLearning(raw: { file: string; data: unknown }[]): LearningEntry[] {
  const problems: string[] = [];
  const entries: LearningEntry[] = [];
  const slugs = new Set<string>();
  for (const { file, data } of raw) {
    const parsed = learningEntry.safeParse(data);
    if (!parsed.success) {
      problems.push(...parsed.error.issues.map((i) => `${file}: ${i.path.join(".") || "(Eintrag)"} – ${i.message}`));
      continue;
    }
    if (`${parsed.data.slug}.json` !== file) problems.push(`${file}: slug „${parsed.data.slug}“ passt nicht zum Dateinamen`);
    if (slugs.has(parsed.data.slug)) problems.push(`${file}: slug doppelt`);
    slugs.add(parsed.data.slug);
    entries.push(parsed.data);
  }
  if (problems.length) throw new Error(`Learning-Bibliothek ungültig:\n${problems.join("\n")}`);
  return entries;
}

/**
 * Reihenfolge im Feed: Kategorien abwechselnd (Reihenfolge wie LEARNING_CATEGORIES), Referenz-Karten zuerst.
 * Innerhalb einer Kategorie bleibt die Reihenfolge der Eingabe.
 */
export function interleave(entries: LearningEntry[], references: readonly string[]): LearningEntry[] {
  const byCategory = LEARNING_CATEGORIES.map((cat) => {
    const own = entries.filter((e) => e.category === cat);
    return [...own.filter((e) => references.includes(e.slug)), ...own.filter((e) => !references.includes(e.slug))];
  });
  const rounds = Math.max(0, ...byCategory.map((c) => c.length));
  const out: LearningEntry[] = [];
  for (let i = 0; i < rounds; i++) for (const cat of byCategory) if (cat[i]) out.push(cat[i]);
  return out;
}

export function learningToCard(entry: LearningEntry): DiscoverCard {
  const { source } = entry;
  const detail = [source.detail, `Basis: ${BASIS_LABEL[entry.basis]}`, entry.reviewed ? null : "noch nicht geprüft"].filter(Boolean).join(" · ");
  return {
    id: `learn:${entry.slug}`,
    feed: "learning",
    category: entry.category,
    categories: [entry.category],
    title: entry.title,
    lead: entry.lead,
    sections: entry.sections,
    takeaway: entry.takeaway,
    source: {
      name: source.year ? `${source.title} (${source.year})` : source.title,
      author: source.author,
      url: source.url,
      detail,
    },
    depth: "full",
  };
}
