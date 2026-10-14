import { NextResponse, type NextRequest } from "next/server";
import { hasSession } from "@/lib/auth";
import { submitFeedback } from "@/features/discover/feedback";

// Discover „Relevant“: Body nur { "storyId": string }, alles andere wird ignoriert.
// Antworten: 200 { status: "ok" | "already" | "dry-run" }, 400, 401, 403, 404, 503 (generisch, Details nur im Log).

const MAX_BODY = 2048;

export async function POST(request: NextRequest) {
  if (!(await hasSession())) return NextResponse.json({ status: "unauthorized" }, { status: 401 });

  // Nur Aufrufe von der eigenen Seite (zusätzlich zu SameSite-Cookie).
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ status: "forbidden" }, { status: 403 });

  const raw = await request.text().catch(() => "");
  let body: unknown = null;
  if (raw.length <= MAX_BODY) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
  }

  const outcome = await submitFeedback(body);
  return NextResponse.json({ status: outcome.status }, { status: outcome.http, headers: { "Cache-Control": "no-store" } });
}
