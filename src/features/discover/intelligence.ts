import type { Impact, Story, Topic } from "@/features/digest/types";
import type { CardSection, DiscoverCard } from "./types";

// Intelligence-Adapter: Story aus dem Digest Archive → Discover-Karte. Rein und getestet.
// Felder ab „Kernpunkte“ gibt es erst seit 14.10.2026; ältere Stories werden zu kompakten Thin-Cards.

export const CATEGORY: Record<Topic, string> = {
  ai: "AI & Technology",
  economy: "Business & Markets",
  geopolitics: "Geopolitics",
  vc: "Opportunities",
};
export const FALLBACK_CATEGORY = "Briefing";

export const LEAD_MAX = 240;
export const FRONT_POINTS = 3;
const IMPACT_RANK: Record<Impact, number> = { high: 0, medium: 1, low: 2 };

export function isEconomist(storyId: string | undefined): boolean {
  return !!storyId?.startsWith("economist:");
}

/** „Wert – Label“, getrennt am ersten „ – “ (Halbgeviertstrich mit Leerzeichen). Ohne Trenner keine Kennzahl. */
export function parseMetric(raw: string): { value: string; label: string } | undefined {
  const i = raw.indexOf(" – ");
  if (i <= 0) return undefined;
  const value = raw.slice(0, i).trim();
  const label = raw.slice(i + 3).trim();
  return value && label ? { value, label } : undefined;
}

/** Kürzt an einer Wortgrenze und hängt „…“ an. */
export function shorten(text: string, max = LEAD_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:–-]+$/, "")}…`;
}

function hostname(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function sourceName(story: Story): string {
  if (story.feedName) return story.feedName;
  return hostname(story.url) ?? (isEconomist(story.storyId) ? "The Economist" : "Digest");
}

export function isFull(story: Story): boolean {
  return story.whyRelevant !== "";
}

export function storyToCard(story: Story): DiscoverCard {
  const full = isFull(story);
  const categories = story.topics.map((t) => CATEGORY[t]);
  const sections: CardSection[] = [];
  if (story.points.length) sections.push({ label: "Kernpunkte", body: story.points.join("\n"), kind: "fact" });
  if (story.whyRelevant) sections.push({ label: "Warum relevant", body: story.whyRelevant, kind: "analysis" });
  if (story.outlook) sections.push({ label: "Was folgen könnte", body: story.outlook, kind: "outlook" });
  if (story.chance) sections.push({ label: "Chance für dich", body: story.chance, kind: "analysis" });

  return {
    id: `digest:${story.storyId}`,
    feed: "intelligence",
    category: categories[0] ?? FALLBACK_CATEGORY,
    categories: categories.length ? categories : [FALLBACK_CATEGORY],
    title: story.title,
    lead: shorten(story.takeaway),
    points: full ? story.points.slice(0, FRONT_POINTS) : [],
    sections: full ? sections : [],
    stat: full ? parseMetric(story.metric) : undefined,
    impact: story.impact ?? undefined,
    source: {
      name: sourceName(story),
      url: story.url ?? undefined,
      detail: story.sources > 1 ? `${story.sources} Quellen im Cluster` : undefined,
    },
    date: story.date,
    depth: full ? "full" : "thin",
    storyId: story.storyId,
  };
}

/** Pro Story ID eine Zeile: die vollständigere, bei Gleichstand die jüngere (Economist-IDs kommen morgens und abends). */
export function dedupeStories(stories: Story[]): Story[] {
  const best = new Map<string, Story>();
  for (const s of stories) {
    const prev = best.get(s.storyId);
    const better = !prev || (isFull(s) && !isFull(prev)) || (isFull(s) === isFull(prev) && s.createdAt > prev.createdAt);
    if (better) best.set(s.storyId, s);
  }
  return stories.filter((s) => best.get(s.storyId) === s);
}

/**
 * Reihenfolge: Digest-Tag absteigend; innerhalb eines Tages volle Karten vor Thin-Cards, Impact Hoch → Niedrig
 * (ohne Impact zuletzt), dann der jüngere Lauf zuerst, sonst Schreibreihenfolge (= Reihenfolge in der Mail).
 */
export function orderStories(stories: Story[], runOf: (s: Story) => "morning" | "evening"): Story[] {
  const run = (s: Story) => (runOf(s) === "evening" ? 0 : 1);
  return dedupeStories(stories)
    .map((s, i) => ({ s, i }))
    .sort(
      (a, b) =>
        b.s.date.localeCompare(a.s.date) ||
        Number(isFull(b.s)) - Number(isFull(a.s)) ||
        (a.s.impact ? IMPACT_RANK[a.s.impact] : 3) - (b.s.impact ? IMPACT_RANK[b.s.impact] : 3) ||
        run(a.s) - run(b.s) ||
        a.s.createdAt.localeCompare(b.s.createdAt) ||
        a.i - b.i,
    )
    .map(({ s }) => s);
}
