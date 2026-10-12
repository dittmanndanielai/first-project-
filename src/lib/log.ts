// Strukturierte Logs ohne Inhalte: nur Event, IDs, Status, Dauer.
// Nie Task-Titel, Transkripte, Tokens oder Request-Bodies loggen.

type Fields = Record<string, string | number | boolean | null | undefined>;

export function log(event: string, fields: Fields = {}) {
  console.log(JSON.stringify({ t: new Date().toISOString(), event, ...fields }));
}

export function logError(event: string, err: unknown, fields: Fields = {}) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ t: new Date().toISOString(), event, error: message.slice(0, 300), ...fields }));
}
