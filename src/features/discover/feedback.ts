import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";
import { log, logError } from "@/lib/log";
import { notion } from "@/lib/notion";
import { isoDate } from "@/lib/time";
import { TOPIC_TO_NOTION } from "@/features/digest/notion-map";
import { feedbackExistsQuery, feedbackPage, queryResult, type FeedbackEntry } from "./notion-map";
import { STORY_ID } from "./rules";
import { findStory } from "./store";

// „Relevant“ aus Discover → ein `klick` in Notion „Digest Feedback“ (dasselbe Signal wie ein Klick in der Mail).
// Alle Werte leitet der Server aus dem Archiv ab; vom Client zählt nur die Story ID.
// Ohne DISCOVER_FEEDBACK_WRITE=true: Dry-Run. Prüfungen laufen echt (lesend), geschrieben wird nichts.

export type FeedbackOutcome =
  | { http: 200; status: "ok" | "already" | "dry-run" }
  | { http: 400; status: "invalid" }
  | { http: 404; status: "not_found" }
  | { http: 503; status: "unavailable" };

// Zusätzliche Felder im Body verwirft Zod (z. B. eine mitgeschickte „Quelle“).
const input = z.object({ storyId: z.string().max(64) });

// Pro Server-Instanz: laufende Anfragen (gleichzeitige Doppel-Taps) und heute schon geschriebene Klicks.
// Das zweite fängt ab, dass eine frisch angelegte Notion-Seite kurz noch nicht in Abfragen auftaucht.
const inflight = new Map<string, Promise<FeedbackOutcome>>();
const written = new Set<string>();
const mockFeedback = new Set<string>(); // DATA_SOURCE=mock: „Digest Feedback“ im Speicher

/** Nur für Tests. */
export function resetFeedbackState() {
  inflight.clear();
  written.clear();
  mockFeedback.clear();
}

async function alreadyClicked(storyId: string, day: string): Promise<boolean> {
  const e = env();
  if (e.DATA_SOURCE === "mock") return mockFeedback.has(`${storyId}:${day}`);
  const res = await notion<unknown>(`data_sources/${e.NOTION_FEEDBACK_DS_ID}/query`, {
    method: "POST",
    body: feedbackExistsQuery(storyId, day),
  });
  return queryResult.parse(res).results.length > 0;
}

async function write(entry: FeedbackEntry): Promise<void> {
  const e = env();
  if (e.DATA_SOURCE === "mock") {
    mockFeedback.add(`${entry.storyId}:${entry.day}`);
    return;
  }
  await notion("pages", { method: "POST", body: feedbackPage(e.NOTION_FEEDBACK_DS_ID, entry) });
}

async function process(storyId: string, day: string): Promise<FeedbackOutcome> {
  const started = Date.now();
  let step = "story";
  try {
    const story = await findStory(storyId);
    if (!story) {
      log("discover.feedback.not_found", { storyId });
      return { http: 404, status: "not_found" };
    }
    const entry: FeedbackEntry = {
      storyId,
      feedName: story.feedName, // leer bleibt leer: kein Hostname, das Scoring erwartet Feednamen
      topic: story.topics[0] ? TOPIC_TO_NOTION[story.topics[0]] : "",
      title: story.title,
      day,
    };

    step = "duplicate";
    if (await alreadyClicked(storyId, day)) {
      log("discover.feedback.already", { storyId, ms: Date.now() - started });
      return { http: 200, status: "already" };
    }

    if (!env().DISCOVER_FEEDBACK_WRITE) {
      log("discover.feedback.dry_run", { storyId, day, topic: entry.topic, feedName: entry.feedName !== "", ms: Date.now() - started });
      return { http: 200, status: "dry-run" };
    }

    step = "write";
    await write(entry);
    log("discover.feedback.written", { storyId, day, ms: Date.now() - started });
    return { http: 200, status: "ok" };
  } catch (err) {
    logError("discover.feedback", err, { storyId, step });
    return { http: 503, status: "unavailable" };
  }
}

export async function submitFeedback(body: unknown, now = new Date()): Promise<FeedbackOutcome> {
  const parsed = input.safeParse(body);
  if (!parsed.success || !STORY_ID.test(parsed.data.storyId)) return { http: 400, status: "invalid" };
  const { storyId } = parsed.data;
  const day = isoDate(now, env().APP_TIMEZONE);
  const key = `${storyId}:${day}`;

  const pending = inflight.get(key);
  if (pending) {
    const first = await pending;
    return first.http === 200 ? { http: 200, status: "already" } : first;
  }
  if (written.has(key)) return { http: 200, status: "already" };

  // Erst merken, dann die Sperre lösen: kein Zeitfenster für einen dritten Tap dazwischen.
  const run = process(storyId, day)
    .then((outcome) => {
      if (outcome.http === 200 && outcome.status !== "dry-run") {
        for (const k of written) if (!k.endsWith(`:${day}`)) written.delete(k); // Vortage vergessen
        written.add(key);
      }
      return outcome;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, run);
  return run;
}
