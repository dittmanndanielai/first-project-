import { z } from "zod";

// EINZIGE Stelle mit Property-Namen der Notion-Datenbank „Digest Feedback“.
// Das Digest-Scoring (n8n B_news_digest) gibt Quellen und Themenfeldern mit `klick`-Einträgen der letzten 30 Tage
// einen Bonus. Auch Klicks in der Digest-Mail schreiben hier. Personal OS schreibt nur `klick` über „Relevant“.

export const FEEDBACK = {
  name: "Name",
  type: "Typ",
  storyId: "Story ID",
  feedName: "Quelle",
  topic: "Themenfeld",
  date: "Datum",
} as const;

/** Vorhandene Select-Option (keine Schemaänderung). */
export const FEEDBACK_CLICK = "klick";

const NAME_MAX = 200;

export type FeedbackEntry = {
  storyId: string;
  feedName: string; // „Quelle“ der Story; leer bleibt leer (Scoring erwartet Feednamen, keinen Hostnamen)
  topic: string; // erstes Themenfeld, Notion-Name (z. B. „KI“)
  title: string;
  day: string; // YYYY-MM-DD, Europe/Berlin
};

/** Gibt es heute schon einen `klick` für die Story (aus Discover oder aus der Mail)? */
export function feedbackExistsQuery(storyId: string, day: string) {
  return {
    filter: {
      and: [
        { property: FEEDBACK.storyId, rich_text: { equals: storyId } },
        { property: FEEDBACK.date, date: { equals: day } },
        { property: FEEDBACK.type, select: { equals: FEEDBACK_CLICK } },
      ],
    },
    page_size: 1,
  };
}

const text = (content: string) => (content ? [{ type: "text" as const, text: { content } }] : []);

export function feedbackName(entry: Pick<FeedbackEntry, "feedName" | "title">): string {
  const name = `Relevant: ${entry.feedName || entry.title}`;
  return name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1)}…` : name;
}

/** Body für POST /v1/pages (API 2025-09-03, Parent = Data Source). */
export function feedbackPage(dataSourceId: string, entry: FeedbackEntry) {
  return {
    parent: { type: "data_source_id" as const, data_source_id: dataSourceId },
    properties: {
      [FEEDBACK.name]: { title: text(feedbackName(entry)) },
      [FEEDBACK.type]: { select: { name: FEEDBACK_CLICK } },
      [FEEDBACK.storyId]: { rich_text: text(entry.storyId) },
      [FEEDBACK.feedName]: { rich_text: text(entry.feedName) },
      [FEEDBACK.topic]: { rich_text: text(entry.topic) },
      [FEEDBACK.date]: { date: { start: entry.day } },
    },
  };
}

export const queryResult = z.object({ results: z.array(z.unknown()) });
