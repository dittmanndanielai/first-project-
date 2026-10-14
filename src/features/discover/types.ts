import type { Impact } from "@/features/digest/types";

// Gemeinsames Frontend-Modell für beide Discover-Feeds. Intelligence kommt aus dem Notion „Digest Archive“
// (intelligence.ts), Learning aus der kuratierten Bibliothek im Repo (learning.ts, content/learning).

export type DiscoverFeed = "intelligence" | "learning";

/** fact ohne Label; analysis und outlook erscheinen als „Einschätzung“, damit Fakt und Analyse getrennt bleiben. */
export type SectionKind = "fact" | "analysis" | "outlook" | "critique" | "application";

export type CardSection = {
  label: string;
  body: string; // Zeilenumbrüche = Aufzählung
  kind: SectionKind;
};

export type DiscoverCard = {
  id: string; // "digest:<storyId>" | "learn:<slug>"
  feed: DiscoverFeed;
  category: string; // Anzeigekategorie (erste)
  categories: string[]; // alle Kategorien für den Filter, erste = category
  title: string;
  lead: string; // Vorderseite, höchstens ~240 Zeichen
  points?: string[]; // höchstens 3 auf der Vorderseite
  sections: CardSection[]; // „Mehr lesen“
  takeaway?: string;
  stat?: { value: string; label: string };
  impact?: Impact;
  source: { name: string; url?: string; author?: string; detail?: string };
  date?: string; // YYYY-MM-DD; Intelligence = Tag des Digest-Laufs, nie Veröffentlichungsdatum
  depth: "full" | "thin"; // thin = nur Titel und Kernaussage (Altzeilen vor 14.10.2026)
  storyId?: string; // nur Intelligence
};

export type IntelligenceStatus = "ok" | "empty" | "not_shared" | "error";
