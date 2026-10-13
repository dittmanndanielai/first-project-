import { z } from "zod";
import type { Story, Topic } from "./types";

// EINZIGE Stelle mit Property-Namen des Notion „Digest Archive“.
// Schreiber ist n8n B_news_digest, die App liest nur. Vertrag: docs/notion-contract.md

export const PROP = {
  title: "Titel",
  takeaway: "Kernaussage",
  date: "Datum",
  topics: "Themenfeld",
  sources: "Source Count",
  url: "Canonical URL",
  storyId: "Story ID",
} as const;

const TOPIC_FROM_NOTION: Record<string, Topic> = { Geopolitik: "geopolitics", Wirtschaft: "economy", KI: "ai", VC: "vc" };

const page = z.object({
  id: z.string(),
  created_time: z.string(),
  in_trash: z.boolean().optional(),
  parent: z.object({ database_id: z.string().optional() }).partial().optional(),
  properties: z.record(z.string(), z.unknown()),
});
const richText = z.array(z.object({ plain_text: z.string() }));

function text(value: unknown, key: "title" | "rich_text"): string {
  const field = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
  const parsed = richText.safeParse(field);
  return parsed.success ? parsed.data.map((t) => t.plain_text).join("").trim() : "";
}

/** Nur http(s): verhindert javascript:- oder data:-Links aus Fremddaten. */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function storyFromNotion(raw: unknown): Story | null {
  const parsed = page.safeParse(raw);
  if (!parsed.success || parsed.data.in_trash) return null;
  const p = parsed.data.properties;

  const title = text(p[PROP.title], "title");
  const date = z.object({ date: z.object({ start: z.string() }).nullable() }).safeParse(p[PROP.date]);
  const day = date.success ? date.data.date?.start.slice(0, 10) : undefined;
  if (!title || !day) return null;

  const topics = z.object({ multi_select: z.array(z.object({ name: z.string() })) }).safeParse(p[PROP.topics]);
  const sources = z.object({ number: z.number().nullable() }).safeParse(p[PROP.sources]);
  const url = z.object({ url: z.string().nullable() }).safeParse(p[PROP.url]);

  return {
    id: parsed.data.id,
    storyId: text(p[PROP.storyId], "rich_text") || parsed.data.id,
    title,
    takeaway: text(p[PROP.takeaway], "rich_text"),
    date: day,
    topics: topics.success ? topics.data.multi_select.map((t) => TOPIC_FROM_NOTION[t.name]).filter((t): t is Topic => !!t) : [],
    sources: sources.success ? (sources.data.number ?? 1) : 1,
    url: url.success ? safeUrl(url.data.url) : null,
    createdAt: parsed.data.created_time,
  };
}

/** Link auf die Archiv-Datenbank in Notion, aus dem Parent einer Story (spart eine eigene Konfiguration). */
export function archiveUrlFromNotion(raw: unknown): string | null {
  const parsed = page.safeParse(raw);
  const id = parsed.success ? parsed.data.parent?.database_id : undefined;
  return id ? `https://www.notion.so/${id.replaceAll("-", "")}` : null;
}

/** Stories der letzten Tage, neueste zuerst. Die App zeigt davon nur die jüngste Ausgabe. */
export function recentStoriesQuery(since: string, cursor?: string) {
  return {
    filter: { property: PROP.date, date: { on_or_after: since } },
    // Zweite Sortierung nach Schreibzeit: entspricht der Reihenfolge in der Mail.
    sorts: [
      { property: PROP.date, direction: "descending" as const },
      { timestamp: "created_time" as const, direction: "ascending" as const },
    ],
    page_size: 100,
    ...(cursor ? { start_cursor: cursor } : {}),
  };
}
