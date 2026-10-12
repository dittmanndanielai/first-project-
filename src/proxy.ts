import { NextResponse, type NextRequest } from "next/server";
import { env } from "./lib/env";
import { checkSessionToken, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "./lib/session";

// Optimistische Prüfung vor jeder Seite. Die eigentliche Absicherung passiert zusätzlich
// in jeder Page, Server Action und Route (requireSession / Token-Prüfung).

// Diese Routen authentifizieren sich selbst (Bearer-Token, Secret) oder sind öffentlich.
const PUBLIC_PATHS = ["/login", "/api/capture", "/api/health", "/api/hooks/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : p + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const e = env();
  const cfg = { secret: e.SESSION_SECRET, version: e.SESSION_VERSION };
  const check = await checkSessionToken(request.cookies.get(SESSION_COOKIE)?.value, cfg);

  if (!check.valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  if (check.renew) {
    response.cookies.set(SESSION_COOKIE, await createSessionToken(cfg), sessionCookieOptions());
  }
  return response;
}

export const config = {
  // Alles außer statischen Assets, Manifest und Icons.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|fonts/).*)"],
};
