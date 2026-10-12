import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { hasSession } from "@/lib/auth";
import { TAGS } from "@/lib/cache-tags";
import { captureTokenHashes } from "@/lib/env";
import { log, logError } from "@/lib/log";
import { N8nError } from "@/lib/n8n";
import { capture, captureInput } from "@/features/capture/capture";

// Quick Capture für Siri-Kurzbefehl, Action Button und Mac-Hotkey.
// Auth: "Authorization: Bearer <Geräte-Token>" (Hash in CAPTURE_TOKENS) oder Session-Cookie.

function bearerAllowed(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const hash = createHash("sha256").update(match[1].trim()).digest();
  return captureTokenHashes().some((allowed) => {
    const expected = Buffer.from(allowed, "hex");
    return expected.length === hash.length && timingSafeEqual(expected, hash);
  });
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  const viaToken = bearerAllowed(request);
  if (!viaToken && !(await hasSession())) {
    return NextResponse.json({ ok: false, nachricht: "Nicht autorisiert." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = captureInput.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ ok: false, nachricht: "Ich habe nichts verstanden. Versuch es nochmal." }, { status: 400 });
  }

  try {
    const result = await capture(input.data);
    revalidateTag(TAGS.tasks, { expire: 0 });
    log("capture", { via: viaToken ? "token" : "session", anzahl: result.anzahl, ms: Date.now() - started });
    return NextResponse.json(result);
  } catch (err) {
    logError("capture.failed", err, { via: viaToken ? "token" : "session" });
    const status = err instanceof N8nError ? err.status : 500;
    const nachricht =
      status === 504 ? "Das dauert gerade zu lange. Schau gleich in Notion nach." : "Speichern hat nicht geklappt. Bitte gleich nochmal versuchen.";
    return NextResponse.json({ ok: false, nachricht }, { status });
  }
}
