import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";
import { checkSessionToken, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "./session";

function sessionConfig() {
  const e = env();
  return { secret: e.SESSION_SECRET, version: e.SESSION_VERSION };
}

/** true, wenn ein gültiges Session-Cookie vorliegt. Liest cookies() (Request-Zeit). */
export async function hasSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return (await checkSessionToken(token, sessionConfig())).valid;
}

/**
 * Pflicht vor jedem Datenzugriff in Pages, Server Actions und Route Handlers.
 * Leitet ohne Session auf /login um (in Route Handlers stattdessen hasSession() nutzen).
 */
export async function requireSession(): Promise<void> {
  if (!(await hasSession())) redirect("/login");
}

/** Nur in Server Actions oder Route Handlers aufrufen (setzt ein Cookie). */
export async function startSession(): Promise<void> {
  const token = await createSessionToken(sessionConfig());
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
