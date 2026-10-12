import { jwtVerify, SignJWT } from "jose";

// Reine Token-Logik ohne Next-Abhängigkeiten: nutzbar in proxy.ts, Server Code und Tests.

export const SESSION_COOKIE = "pos_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 Tage
const RENEW_BELOW_S = 60 * 60 * 24 * 7; // Verlängern, wenn weniger als 7 Tage übrig

type SessionConfig = { secret: string; version: string };

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(cfg: SessionConfig): Promise<string> {
  return new SignJWT({ v: cfg.version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_S}s`)
    .sign(key(cfg.secret));
}

export type SessionCheck = { valid: false } | { valid: true; renew: boolean };

export async function checkSessionToken(token: string | undefined, cfg: SessionConfig): Promise<SessionCheck> {
  if (!token) return { valid: false };
  try {
    const { payload } = await jwtVerify(token, key(cfg.secret), { algorithms: ["HS256"], subject: "owner" });
    // SESSION_VERSION erhöhen = überall abmelden.
    if (payload.v !== cfg.version) return { valid: false };
    const secondsLeft = (payload.exp ?? 0) - Math.floor(Date.now() / 1000);
    return { valid: true, renew: secondsLeft < RENEW_BELOW_S };
  } catch {
    return { valid: false };
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  };
}
