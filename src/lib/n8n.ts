import "server-only";
import { env } from "./env";

// Aufrufe an n8n-Webhooks. Der Schlüssel-Header wird gesendet, sobald N8N_WEBHOOK_KEY gesetzt ist
// (n8n prüft ihn nach Freigabe F2 per Header Auth).

export const N8N_KEY_HEADER = "X-Personal-OS-Key";
const TIMEOUT_MS = 15_000;

export class N8nError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "N8nError";
  }
}

export async function postToN8n(url: string, body: unknown): Promise<unknown> {
  const key = env().N8N_WEBHOOK_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers[N8N_KEY_HEADER] = key;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    throw new N8nError(timeout ? 504 : 502, timeout ? "n8n timeout" : "n8n unreachable");
  }
  if (!res.ok) throw new N8nError(502, `n8n responded ${res.status}`);
  return res.json().catch(() => {
    throw new N8nError(502, "n8n returned no JSON");
  });
}
