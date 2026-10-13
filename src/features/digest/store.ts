import "server-only";
import { cache } from "react";
import { env } from "@/lib/env";
import { logError } from "@/lib/log";
import { notion, NotionError } from "@/lib/notion";
import { TAGS, TTL } from "@/lib/cache-tags";
import { isoDate, minusDays } from "@/lib/time";
import { mockStories } from "@/mocks/digest";
import { archiveUrlFromNotion, recentStoriesQuery, storyFromNotion } from "./notion-map";
import { latestEdition } from "./rules";
import type { Edition, Story } from "./types";

// Nur lesend: Schreiber des „Digest Archive“ ist n8n B_news_digest.

type QueryResult = { results: unknown[]; has_more: boolean; next_cursor: string | null };

export type DigestResult =
  | { status: "ok"; edition: Edition; archiveUrl: string | null }
  | { status: "empty" } // keine Ausgabe in den letzten Tagen
  | { status: "not_shared" } // Datenbank nicht mit der Notion-Connection „Personal OS Web“ geteilt
  | { status: "error" };

const LOOKBACK_DAYS = 3; // deckt ein Wochenende ohne Lauf ab
const MAX_PAGES = 3;

async function notionStories(today: string): Promise<{ stories: Story[]; archiveUrl: string | null }> {
  const raw: unknown[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const res = await notion<QueryResult>(`data_sources/${env().NOTION_DIGEST_DS_ID}/query`, {
      method: "POST",
      body: recentStoriesQuery(minusDays(today, LOOKBACK_DAYS), cursor),
      cache: { revalidate: TTL.digest, tags: [TAGS.digest] },
    });
    raw.push(...res.results);
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor && ++pages < MAX_PAGES);
  return {
    stories: raw.map(storyFromNotion).filter((s): s is Story => s !== null),
    archiveUrl: raw.length ? archiveUrlFromNotion(raw[0]) : null,
  };
}

/** Jüngste Digest-Ausgabe (Morgen 08:00 oder Abend 17:00). Pro Request nur einmal geladen. */
export const getDigest = cache(async (): Promise<DigestResult> => {
  const e = env();
  const today = isoDate(new Date(), e.APP_TIMEZONE);
  try {
    const { stories, archiveUrl } =
      e.DATA_SOURCE === "mock" ? { stories: mockStories(today), archiveUrl: null } : await notionStories(today);
    const edition = latestEdition(stories, e.APP_TIMEZONE);
    return edition ? { status: "ok", edition, archiveUrl } : { status: "empty" };
  } catch (err) {
    if (err instanceof NotionError && (err.status === 404 || err.code === "object_not_found")) return { status: "not_shared" };
    logError("digest.load", err);
    return { status: "error" };
  }
});
