import { NextResponse, type NextRequest } from "next/server";
import { hasSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { logError } from "@/lib/log";

// Mintet ein kurzlebiges Conversation-Token (WebRTC) für den bestehenden ElevenLabs-Agenten.
// Der API-Key verlässt nie den Server.

export async function POST(request: NextRequest) {
  if (!(await hasSession())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Nur Aufrufe von der eigenen Seite (zusätzlich zu SameSite-Cookie).
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID } = env();
  if (!ELEVENLABS_API_KEY) return NextResponse.json({ error: "voice_not_configured" }, { status: 503 });

  const url = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(ELEVENLABS_AGENT_ID)}`;
  try {
    const res = await fetch(url, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      // 429 = Tages- oder Parallel-Limit des Agenten erreicht
      const error = res.status === 429 ? "limit_reached" : "token_failed";
      return NextResponse.json({ error }, { status: res.status === 429 ? 429 : 502 });
    }
    const data = (await res.json()) as { token?: string };
    if (!data.token) return NextResponse.json({ error: "token_failed" }, { status: 502 });
    return NextResponse.json({ token: data.token }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logError("voice.token", err);
    return NextResponse.json({ error: "token_failed" }, { status: 502 });
  }
}
