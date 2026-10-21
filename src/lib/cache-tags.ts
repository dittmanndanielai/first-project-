// Einzige Quelle für Cache-Tags. Nach einer Mutation: updateTag(TAGS.tasks) in Server Actions,
// revalidateTag(TAGS.tasks, { expire: 0 }) in Route Handlers.
export const TAGS = {
  tasks: "tasks",
  goals: "goals",
  calendar: "calendar",
  digest: "digest",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/** Revalidate-Zeiten in Sekunden für den fetch-Cache. */
export const TTL = {
  tasks: 60,
  goals: 60 * 60 * 24,
  calendar: 5 * 60,
  discover: 30 * 60, // Read-Feed (7 Tage Digest Archive, Tag „digest“); bewusst ohne manuelle Invalidierung
} as const;
