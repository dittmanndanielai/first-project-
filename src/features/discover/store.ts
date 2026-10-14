import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { log, logError } from "@/lib/log";
import { notion, NotionError } from "@/lib/notion";
import { TAGS, TTL } from "@/lib/cache-tags";
import { isoDate, minusDays } from "@/lib/time";
import { mockArchive } from "@/mocks/digest";
import { recentStoriesQuery, storyByIdQuery, storyFromNotion } from "@/features/digest/notion-map";
import { runOf } from "@/features/digest/rules";
import type { Story } from "@/features/digest/types";
import { orderStories, storyToCard } from "./intelligence";
import type { DiscoverCard, IntelligenceStatus } from "./types";

// Intelligence-Feed aus dem Notion „Digest Archive“, nur lesend (Schreiber ist n8n B_news_digest).
// Cache: fetch-Cache wie die Digest-Seite (persistiert auf Vercel), 30 Minuten, Tag „digest“.
// Bewusst kein Endpunkt zur manuellen Invalidierung. Der ganze Feed kommt mit der Seite; Swipen lädt nichts nach.

type QueryResult = { results: unknown[]; has_more: boolean; next_cursor: string | null };

export type IntelligenceResult = { status: IntelligenceStatus; stories: Story[] };

/** Heute plus 6 Vortage = die letzten 7 Kalendertage (Europe/Berlin). */
export const LOOKBACK_DAYS = 6;
const MAX_PAGES = 5; // 500 Zeilen; regulär sind es höchstens 7 × 16

async function notionArchive(today: string): Promise<Story[]> {
  const started = Date.now();
  const raw: unknown[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const res = await notion<QueryResult>(`data_sources/${env().NOTION_DIGEST_DS_ID}/query`, {
      method: "POST",
      body: recentStoriesQuery(minusDays(today, LOOKBACK_DAYS), cursor),
      cache: { revalidate: TTL.discover, tags: [TAGS.digest] },
    });
    raw.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor && ++pages < MAX_PAGES);
  const stories = raw.map(storyFromNotion).filter((s): s is Story => s !== null);
  log("discover.archive", { rows: raw.length, stories: stories.length, pages: pages + 1, ms: Date.now() - started });
  return stories;
}

/** Stories der letzten 7 Tage in Feed-Reihenfolge. Pro Request nur einmal geladen; wirft nie. */
export const getIntelligenceStories = cache(async (): Promise<IntelligenceResult> => {
  const e = env();
  const today = isoDate(new Date(), e.APP_TIMEZONE);
  try {
    const stories = e.DATA_SOURCE === "mock" ? mockArchive(today) : await notionArchive(today);
    const ordered = orderStories(stories, (s) => runOf(s, e.APP_TIMEZONE));
    return { status: ordered.length ? "ok" : "empty", stories: ordered };
  } catch (err) {
    if (err instanceof NotionError && (err.status === 404 || err.code === "object_not_found")) {
      return { status: "not_shared", stories: [] };
    }
    logError("discover.load", err);
    return { status: "error", stories: [] };
  }
});

export async function getIntelligenceFeed(): Promise<{ status: IntelligenceStatus; cards: DiscoverCard[] }> {
  const { status, stories } = await getIntelligenceStories();
  return { status, cards: stories.map(storyToCard) };
}

/**
 * Story zur ID: zuerst im (gecachten) Feed, sonst einmal direkt im Archiv (ohne Cache).
 * Wirft bei Notion-Fehlern, damit der Aufrufer „nicht gefunden“ von „nicht erreichbar“ unterscheiden kann.
 */
export async function findStory(storyId: string): Promise<Story | null> {
  const feed = await getIntelligenceStories();
  const hit = feed.stories.find((s) => s.storyId === storyId);
  if (hit) return hit;
  if (env().DATA_SOURCE === "mock") return null;

  const res = await notion<QueryResult>(`data_sources/${env().NOTION_DIGEST_DS_ID}/query`, {
    method: "POST",
    body: storyByIdQuery(storyId),
  });
  return (
    res.results
      .map(storyFromNotion)
      .find((s): s is Story => s !== null && s.storyId === storyId) ?? null
  );
}
