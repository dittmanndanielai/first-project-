export type Topic = "geopolitics" | "economy" | "ai" | "vc";

/** Eine Zeile im Notion „Digest Archive“ (geschrieben von n8n B_news_digest). */
export type Story = {
  id: string;
  storyId: string; // „Story ID“ aus n8n, Economist-IDs wiederholen sich zwischen Morgen- und Abendlauf
  title: string;
  takeaway: string; // „Kernaussage“
  date: string; // YYYY-MM-DD
  topics: Topic[]; // Reihenfolge wie in Notion, das erste Thema bestimmt die Rubrik
  sources: number; // „Source Count“
  url: string | null; // Original-Artikel, nur http(s); Economist-Zeilen haben oft keinen
  createdAt: string; // ISO-Zeitpunkt des Schreibens, trennt Morgen- (08:00) und Abendausgabe (17:00)
};

export type Section = { lead: Story; items: Story[] };

export type EditionRun = "morning" | "evening";

export type Edition = {
  date: string;
  run: EditionRun;
  brief: Section | null; // Geopolitik, KI
  markets: Section | null; // Wirtschaft, VC
  count: number; // angezeigte Stories
  hidden: number; // über SECTION_SIZE hinaus, nur im Notion-Archiv
};

export type ForYouItem = { title: string; detail: string };
