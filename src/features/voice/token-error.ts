// Übersetzt Antworten von ElevenLabs GET /v1/convai/conversation/token in eigene Fehlercodes.
// `reason` ist nur der maschinenlesbare Status aus `detail.status` (z. B. "missing_permissions"),
// nie die Fehlermeldung selbst. So bleibt er für Logs und UI unbedenklich.

export type TokenErrorCode = "key_rejected" | "agent_not_found" | "limit_reached" | "token_failed";

export function upstreamReason(body: unknown): string | undefined {
  const detail = (body as { detail?: unknown } | null)?.detail;
  const status = (detail as { status?: unknown } | null)?.status;
  return typeof status === "string" && /^[a-z_]{1,64}$/.test(status) ? status : undefined;
}

export function tokenErrorCode(httpStatus: number): TokenErrorCode {
  if (httpStatus === 401 || httpStatus === 403) return "key_rejected";
  if (httpStatus === 404) return "agent_not_found";
  // 429 = Tages- oder Parallel-Limit des Agenten erreicht
  if (httpStatus === 429) return "limit_reached";
  return "token_failed";
}
