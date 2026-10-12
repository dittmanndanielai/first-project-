import "server-only";
import { z } from "zod";
import { hasSession } from "./auth";
import { logError } from "./log";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/** Fachlicher Fehler mit Text für den Nutzer (z. B. „Top 3 is full“). */
export class UserError extends Error {}

/**
 * Pflicht-Wrapper für jede Server Action: Session prüfen, Eingabe mit Zod validieren,
 * Fehler in eine einheitliche Antwort übersetzen. Server Actions sind öffentliche
 * POST-Endpunkte, deshalb gibt es keine Action ohne diesen Wrapper.
 */
export function authedAction<S extends z.ZodType, T>(
  name: string,
  schema: S,
  handler: (input: z.infer<S>) => Promise<T>,
) {
  return async (input: z.input<S>): Promise<ActionResult<T>> => {
    if (!(await hasSession())) return { ok: false, error: "Not signed in" };
    const parsed = schema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid input" };
    try {
      return { ok: true, data: await handler(parsed.data) };
    } catch (err) {
      if (err instanceof UserError) return { ok: false, error: err.message };
      logError(`action.${name}`, err);
      return { ok: false, error: "Not saved. Please try again." };
    }
  };
}
