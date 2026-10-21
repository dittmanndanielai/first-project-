export type Topic = "geopolitics" | "economy" | "ai" | "vc";

export type Impact = "high" | "medium" | "low";

/** Eine Zeile im Notion „Digest Archive“ (geschrieben von n8n B_news_digest). */
export type Story = {
  id: string;
  storyId: string; // „Story ID“ aus n8n, Economist-IDs wiederholen sich zwischen Morgen- und Abendlauf
  title: string;
  takeaway: string; // „Kernaussage“
  date: string; // YYYY-MM-DD
  topics: Topic[]; // Reihenfolge wie in Notion, das erste Thema ist die angezeigte Kategorie in Read
  sources: number; // „Source Count“
  url: string | null; // Original-Artikel, nur http(s); Economist-Zeilen haben oft keinen
  createdAt: string; // ISO-Zeitpunkt des Schreibens, trennt Morgen- (08:00) und Abendausgabe (17:00)
  // Seit 14.10.2026 von B_news_digest befüllt, bei älteren Zeilen leer:
  points: string[]; // „Kernpunkte“
  whyRelevant: string; // „Warum relevant“ (Einordnung)
  outlook: string; // „Was folgen könnte“ (Ausblick)
  chance: string; // „Chance“
  impact: Impact | null; // „Impact“
  metric: string; // „Kennzahl“ im Format „Wert – Label“
  feedName: string; // „Quelle“: Feedname wie im Digest Feedback, oft leer
};

export type EditionRun = "morning" | "evening";
