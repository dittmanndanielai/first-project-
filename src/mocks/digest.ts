import type { Story } from "@/features/digest/types";
import { minusDays } from "@/lib/time";

// Felder, die B_news_digest erst seit 14.10.2026 schreibt; ältere Zeilen haben sie leer.
type NewFields = "points" | "whyRelevant" | "outlook" | "chance" | "impact" | "metric" | "feedName";
const THIN: Pick<Story, NewFields> = { points: [], whyRelevant: "", outlook: "", chance: "", impact: null, metric: "", feedName: "" };
type StoryFields = Omit<Story, "id" | "storyId" | "date" | "createdAt" | NewFields> & Partial<Pick<Story, NewFields>>;

/**
 * Archiv der letzten Tage für Read (DATA_SOURCE=mock): volle Karten (neue Felder), Altzeilen ohne neue Felder,
 * Economist ohne URL, mehrere Themenfelder. Erfundene Demo-Inhalte, keine echten Artikel.
 */
export function mockArchive(today: string): Story[] {
  const yesterday = minusDays(today, 1);
  const story = (storyId: string, date: string, createdAt: string, s: StoryFields): Story => ({
    id: `mock-archive-${storyId}`,
    storyId,
    date,
    createdAt,
    ...THIN,
    ...s,
  });
  const morning = `${today}T06:03:00.000Z`;
  const evening = `${yesterday}T15:03:00.000Z`;
  return [
    story("a1f0c3d2", today, morning, {
      title: "Agenten übernehmen die Buchhaltung im Mittelstand",
      takeaway: "Kleine Firmen kaufen keine Software mehr, sondern erledigte Prozesse – und zahlen pro Ergebnis statt pro Lizenz.",
      topics: ["ai", "economy"],
      sources: 3,
      url: "https://example.com/agenten-buchhaltung",
      points: [
        "Drei Anbieter rechnen pro abgeschlossenem Monatsabschluss ab statt pro Nutzer.",
        "Pilotkunden berichten von 60 bis 70 Prozent weniger manueller Belegarbeit.",
        "Steuerberater werden zur Prüfinstanz statt zur Erfassungsstelle.",
        "Haftungsfragen bei Fehlbuchungen sind vertraglich noch offen.",
      ],
      whyRelevant: "Ergebnisbasierte Preise verschieben das Risiko zum Anbieter. Wer Prozesse zuverlässig automatisiert, kann höhere Margen nehmen als mit Stundensätzen.",
      outlook: "Indikator: Kanzleien, die eigene Agenten-Angebote starten oder Partnerschaften mit Automatisierern eingehen.",
      chance: "Ein festes Paket „Monatsabschluss automatisiert“ für Kunden mit 10 bis 50 Mitarbeitenden, Preis pro Abschluss.",
      impact: "high",
      metric: "60–70 % – weniger manuelle Belegarbeit",
      feedName: "Handelsblatt",
    }),
    story("b2e1d4c3", today, morning, {
      title: "Zinsen sinken langsamer als erwartet",
      takeaway: "Die Notenbank signalisiert Geduld; Märkte preisen eine Senkung weniger ein als noch vor einem Monat.",
      topics: ["economy"],
      sources: 2,
      url: "https://example.com/zinspfad",
      points: ["Die Kerninflation bleibt über dem Ziel.", "Anleiherenditen steigen am langen Ende leicht."],
      whyRelevant: "Ein langsamerer Zinspfad trifft vor allem Wachstumswerte mit Gewinnen weit in der Zukunft.",
      outlook: "Indikator: die nächste Kerninflationszahl und die Wortwahl im Sitzungsprotokoll.",
      chance: "",
      impact: "medium",
      metric: "",
      feedName: "Financial Times",
    }),
    story("economist:" + today + ":1", today, morning, {
      title: "Warum Europas Industrie auf Strompreise starrt",
      takeaway: "Energieintensive Branchen verlagern Investitionen dorthin, wo Strom planbar günstig ist.",
      topics: ["geopolitics", "economy"],
      sources: 1,
      url: null,
      points: ["Langfristige Lieferverträge werden zum Standortfaktor.", "Netzausbau bestimmt das Tempo stärker als Subventionen."],
      whyRelevant: "Standortentscheidungen von heute legen Lieferketten für ein Jahrzehnt fest.",
      outlook: "Indikator: Zahl neuer Langfrist-Stromverträge der Chemie- und Metallbranche.",
      chance: "",
      impact: "high",
      metric: "",
      feedName: "The Economist",
    }),
    story("c3d2e5f4", today, morning, {
      title: "Sprachassistenten werden zur Standardoberfläche",
      takeaway: "Assistenten, die handeln statt nur zu antworten, verändern, was eine App ist.",
      topics: ["ai"],
      sources: 2,
      url: "https://example.com/voice",
      points: ["Mehr Aufgaben enden ohne geöffnete App."],
      whyRelevant: "Wer Abläufe per Sprache auslösbar macht, spart Nutzern Kontextwechsel.",
      outlook: "",
      chance: "",
      impact: "low",
      metric: "",
      feedName: "The Decoder",
    }),
    story("d4c3b2a1", today, morning, {
      title: "Seed-Runden werden kleiner, aber schneller",
      takeaway: "Investoren schreiben kleinere Schecks und entscheiden in Tagen statt Wochen.",
      topics: ["vc"],
      sources: 1,
      url: "https://example.com/seed",
      points: ["Median-Runde sinkt, Zahl der Deals steigt.", "Umsatz ab Tag eins zählt mehr als Teamgröße."],
      whyRelevant: "Für kleine, profitable Teams wird externes Kapital leichter erreichbar, ohne viel abzugeben.",
      outlook: "Indikator: Anteil der Runden unter 1 Mio. Euro im nächsten Quartalsbericht.",
      chance: "Mit nachweisbarem Umsatz früh mit Angels sprechen, statt auf eine große Runde zu warten.",
      impact: "medium",
      metric: "9 Tage – mittlere Entscheidungszeit",
      feedName: "",
    }),
    // Altzeilen vom Vortag: nur Titel, Kernaussage, Datum, URL, Themenfeld, Story ID, Source Count
    story("e5f4a3b2", yesterday, evening, {
      title: "Neobroker wollen, dass du aufhörst, Aktien zu picken",
      takeaway: "Der Sparplan, nicht der einzelne Trade, ist zum Produkt geworden.",
      topics: ["economy", "ai"],
      sources: 2,
      url: "https://example.com/neobroker",
    }),
    story("economist:" + yesterday + ":2", yesterday, evening, {
      title: "Die neue Geografie der Halbleiter",
      takeaway: "Staaten subventionieren Fabriken, doch Fachkräfte bleiben der Engpass.",
      topics: ["geopolitics"],
      sources: 1,
      url: null,
    }),
    story("f6a5b4c3", yesterday, evening, {
      title: "Private-Credit-Fonds suchen die nächste Rendite",
      takeaway: "Das Fundraising verlangsamt sich, während sich die Zinsen einpendeln.",
      topics: ["vc"],
      sources: 1,
      url: "https://example.com/credit",
    }),
  ];
}
