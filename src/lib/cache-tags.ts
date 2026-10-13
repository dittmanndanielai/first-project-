// Einzige Quelle für Cache-Tags. Nach einer Mutation: updateTag(TAGS.tasks) in Server Actions,
// revalidateTag(TAGS.tasks, { expire: 0 }) in Route Handlers.
export const TAGS = {
  tasks: "tasks",
  goals: "goals",
  calendar: "calendar",
  digest: "digest",
  status: "status",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/** Revalidate-Zeiten in Sekunden für den fetch-Cache. */
export const TTL = {
  tasks: 60,
  goals: 60 * 60 * 24,
  calendar: 5 * 60,
  digest: 15 * 60, // neue Ausgabe kommt morgens einmal, kurze TTL hält das Warten danach klein
  status: 5 * 60,
} as const;
