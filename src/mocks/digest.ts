import type { Story } from "@/features/digest/types";

// Beispielinhalte aus dem Design (Board „Digest“), für DATA_SOURCE=mock.
// Abendausgabe = Design, Morgenausgabe mit eigenen Beispielen, damit der Umschalter etwas zeigt.
export function mockStories(today: string): Story[] {
  const evening = `${today}T15:00:00.000Z`; // 17:00 in Berlin
  const morning = `${today}T06:00:00.000Z`; // 08:00 in Berlin
  const story = (n: number, s: Omit<Story, "id" | "storyId" | "date" | "createdAt">, createdAt = evening): Story => ({
    id: `mock-digest-${n}`,
    storyId: `mock-${n}`,
    date: today,
    createdAt,
    ...s,
  });
  return [
    story(
      11,
      {
        title: "Europe's chip plan meets its first real test",
        takeaway: "Subsidies are flowing; the question is whether demand follows the fabs.",
        topics: ["geopolitics", "ai"],
        sources: 3,
        url: "https://example.com/chips",
      },
      morning,
    ),
    story(
      12,
      {
        title: "Open models close the gap on reasoning benchmarks",
        takeaway: "Cheaper inference shifts the moat from model to data and distribution.",
        topics: ["ai"],
        sources: 2,
        url: "https://example.com/open-models",
      },
      morning,
    ),
    story(
      13,
      {
        title: "Seed rounds shrink as investors favour revenue",
        takeaway: "Fewer, larger cheques go to teams with paying customers.",
        topics: ["vc"],
        sources: 2,
        url: "https://example.com/seed",
      },
      morning,
    ),
    story(
      14,
      {
        title: "The euro steadies ahead of the ECB meeting",
        takeaway: "Markets price one more cut this year.",
        topics: ["economy"],
        sources: 1,
        url: null,
      },
      morning,
    ),
    story(1, {
      title: "The back office is where AI agents will earn their keep",
      takeaway: "Banks and brokers are quietly automating reconciliation and onboarding. The winners will redesign the work, not just buy the software.",
      topics: ["ai"],
      sources: 4,
      url: "https://example.com/back-office",
    }),
    story(2, {
      title: "What a slower rate path would mean for European stocks",
      takeaway: "Cheaper funding helps growth names, but earnings — not central banks — will set the next leg.",
      topics: ["economy"],
      sources: 3,
      url: "https://example.com/rates",
    }),
    story(3, {
      title: "Why neobrokers want you to stop picking stocks",
      takeaway: "The savings plan, not the trade, has become the product.",
      topics: ["economy", "ai"],
      sources: 2,
      url: null,
    }),
    story(4, {
      title: "Voice is becoming the default interface for personal software",
      takeaway: "Assistants that act, not just answer, change what an app is.",
      topics: ["ai"],
      sources: 2,
      url: "https://example.com/voice",
    }),
    story(5, {
      title: "The Mittelstand discovers the automation consultant",
      takeaway: "Small firms buy outcomes, not licences.",
      topics: ["geopolitics", "economy"],
      sources: 1,
      url: "https://example.com/mittelstand",
    }),
    story(6, {
      title: "Private credit funds look for the next yield",
      takeaway: "Fundraising slows as rates settle.",
      topics: ["vc"],
      sources: 1,
      url: "https://example.com/credit",
    }),
  ];
}
