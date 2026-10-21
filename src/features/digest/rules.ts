import { hourIn } from "@/lib/time";
import type { EditionRun, Story } from "./types";

// Reine Regeln zum Digest Archive. n8n B_news_digest läuft um 08:00 und 17:00 (Europe/Berlin)
// und speichert keinen Lauf. Die App leitet ihn aus der Schreibzeit ab (Reihenfolge in Read).

export const EVENING_FROM_HOUR = 14;

export function runOf(story: Story, timeZone: string): EditionRun {
  return hourIn(new Date(story.createdAt), timeZone) >= EVENING_FROM_HOUR ? "evening" : "morning";
}
