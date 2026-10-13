import { hourIn } from "@/lib/time";
import { isStale } from "@/features/tasks/rules";
import type { Task } from "@/features/tasks/types";
import type { Edition, EditionRun, ForYouItem, Section, Story, Topic } from "./types";

// Reine Regeln für die Digest-Seite. n8n B_news_digest läuft um 08:00 und 17:00 (Europe/Berlin)
// und speichert weder Rang noch Rubrik. Die App leitet beides deterministisch ab.

export const EVENING_FROM_HOUR = 14;
export const SECTION_SIZE = 8; // ein Lauf hat höchstens 8 Stories, so geht keine verloren
export const RUN_WINDOW_MS = 15 * 60_000; // n8n schreibt einen Lauf innerhalb von Sekunden

const MARKET_TOPICS: readonly Topic[] = ["economy", "vc"];

export const TOPIC_LABEL: Record<Topic, string> = {
  geopolitics: "Geopolitics",
  economy: "Economy",
  ai: "AI",
  vc: "Venture",
};

export function runOf(story: Story, timeZone: string): EditionRun {
  return hourIn(new Date(story.createdAt), timeZone) >= EVENING_FROM_HOUR ? "evening" : "morning";
}

/** Rubrik nach dem ersten Themenfeld: Wirtschaft und VC → Markets & Money, alles andere → Daily Brief. */
export function isMarketStory(story: Story): boolean {
  const primary = story.topics[0];
  return primary !== undefined && MARKET_TOPICS.includes(primary);
}

function section(stories: Story[]): Section | null {
  if (stories.length === 0) return null;
  const [lead, ...rest] = stories;
  return { lead, items: rest.slice(0, SECTION_SIZE - 1) };
}

/**
 * Jüngste Ausgabe = jüngster Lauf: neuester Tag, dort die Zeilen bis 15 Minuten vor der neuesten Schreibzeit.
 * Ein zweiter Lauf am selben Nachmittag (Test, Retry) ersetzt also den ersten, statt sich mit ihm zu mischen.
 * Die 14-Uhr-Grenze bestimmt nur das Label. Doppelte Story-IDs zählen einmal (Sicherheitsnetz).
 * Innerhalb einer Rubrik zuerst die Stories mit den meisten Quellen, sonst Reihenfolge wie geschrieben.
 */
export function latestEdition(stories: Story[], timeZone: string): Edition | null {
  if (stories.length === 0) return null;
  const date = stories.reduce((max, s) => (s.date > max ? s.date : max), stories[0].date);
  const ofDay = stories.filter((s) => s.date === date);
  const newest = ofDay.reduce((max, s) => (s.createdAt > max.createdAt ? s : max), ofDay[0]);
  const since = Date.parse(newest.createdAt) - RUN_WINDOW_MS;
  const run: EditionRun = runOf(newest, timeZone);

  const seen = new Set<string>();
  const picked = ofDay
    .filter((s) => Date.parse(s.createdAt) >= since)
    .filter((s) => {
      if (seen.has(s.storyId)) return false;
      seen.add(s.storyId);
      return true;
    })
    .sort((a, b) => b.sources - a.sources); // stabil: gleiche Quellenzahl behält die Schreibreihenfolge

  const brief = section(picked.filter((s) => !isMarketStory(s)));
  const markets = section(picked.filter(isMarketStory));
  const shown = [brief, markets].reduce((n, sec) => n + (sec ? 1 + sec.items.length : 0), 0);
  return { date, run, brief, markets, count: shown, hidden: picked.length - shown };
}

function shorten(title: string, max = 42): string {
  return title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;
}

function names(tasks: Task[]): string {
  const shown = tasks.slice(0, 2).map((t) => shorten(t.title));
  const more = tasks.length - shown.length;
  return more > 0 ? `${shown.join(", ")} and ${more} more` : shown.join(" and ");
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** „For you“: Hinweise aus den eigenen Aufgaben, ohne KI. Höchstens vier, der Top-3-Stand ist immer dabei. */
export function forYou(tasks: Task[], today: string): ForYouItem[] {
  const open = tasks.filter((t) => t.status === "open");
  const items: ForYouItem[] = [];

  const stale = open.filter(isStale);
  if (stale.length) {
    items.push({
      title: `${count(stale.length, "task is", "tasks are")} past three postponements`,
      detail: `${names(stale)} need a decision.`,
    });
  }

  const overdue = open.filter((t) => t.deadline !== null && t.deadline < today);
  if (overdue.length) items.push({ title: `${count(overdue.length, "task is", "tasks are")} overdue`, detail: names(overdue) });

  const dueToday = open.filter((t) => t.deadline === today);
  if (dueToday.length) items.push({ title: `${count(dueToday.length, "task is", "tasks are")} due today`, detail: names(dueToday) });

  const focus = open.filter((t) => t.focus);
  items.push(
    focus.length
      ? { title: `${count(focus.length, "Top 3 task", "Top 3 tasks")} still open`, detail: names(focus) }
      : { title: "No Top 3 set yet", detail: "Star up to three tasks to set your day." },
  );

  return items.slice(0, 4);
}
