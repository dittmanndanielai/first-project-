import { minutesOfDay } from "@/lib/time";
import type { DiscoverCard } from "./types";

// Reine Regeln der Discover-Seite (Server und Client).

/** Läufe von n8n B_news_digest (Europe/Berlin). */
export const DIGEST_RUNS = ["08:00", "17:00"] as const;

/** Nächster Digest aus der aktuellen Uhrzeit, z. B. „heute um 17:00“ oder „morgen um 08:00“. */
export function nextDigestLabel(now: Date, timeZone: string): string {
  const minutes = minutesOfDay(now, timeZone);
  const next = DIGEST_RUNS.find((t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m > minutes;
  });
  return next ? `heute um ${next}` : `morgen um ${DIGEST_RUNS[0]}`;
}

/** Kategorien in der Reihenfolge ihres ersten Auftretens im Feed (nur was die Daten hergeben). */
export function categoriesOf(cards: DiscoverCard[]): string[] {
  const seen = new Set<string>();
  for (const c of cards) for (const cat of c.categories) seen.add(cat);
  return [...seen];
}

/** null = „Alle“. Eine Karte mit mehreren Themenfeldern erscheint in jedem davon. */
export function filterCards(cards: DiscoverCard[], category: string | null): DiscoverCard[] {
  return category ? cards.filter((c) => c.categories.includes(category)) : cards;
}

/** Feedback-Endpunkt: Hash-IDs aus n8n oder Economist-IDs, sonst ungültig. */
export const STORY_ID = /^(?:[0-9a-f]{6,8}|economist:\d{4}-\d{2}-\d{2}:\d{1,2})$/;
