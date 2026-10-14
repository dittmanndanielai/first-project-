import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { captureTokenHashes, env } from "@/lib/env";
import { calendarUrls } from "@/features/calendar/source";
import { dateLabel } from "@/lib/time";
import { HeaderSkeleton, PageHeader } from "@/features/shell/PageHeader";
import { AppearanceControl } from "@/features/shell/AppearanceControl";
import { signOut } from "./actions";

export default function SettingsPage() {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <Settings />
    </Suspense>
  );
}

type Row = { name: string; detail: string; status: string; ok: boolean };

function calendarRow(raw: string | undefined): Row {
  const { urls, invalid } = calendarUrls(raw);
  if (urls.length) {
    const detail = `Read-only public feed · ${urls.length} calendar${urls.length === 1 ? "" : "s"}${invalid ? ` · ${invalid} invalid link${invalid === 1 ? "" : "s"}` : ""}`;
    return { name: "iCloud Calendar", detail, status: "Configured", ok: invalid === 0 };
  }
  if (invalid) return { name: "iCloud Calendar", detail: "ICLOUD_CALENDAR_URL is not an iCloud link", status: "Invalid", ok: false };
  return { name: "iCloud Calendar", detail: "Set ICLOUD_CALENDAR_URL in Vercel", status: "Not set", ok: false };
}

async function Settings() {
  await requireSession();
  const e = env();
  const tokens = captureTokenHashes().length;

  // Zeigt nur, ob etwas konfiguriert ist, nie Werte.
  const integrations: Row[] = [
    e.DATA_SOURCE === "notion"
      ? { name: "Notion", detail: "TODOS database · source of truth", status: "Connected", ok: true }
      : { name: "Notion", detail: "Demo data (DATA_SOURCE=mock)", status: "Demo", ok: false },
    {
      name: "n8n Cloud",
      detail: e.N8N_CAPTURE_URL ? (e.N8N_WEBHOOK_KEY ? "Quick Capture workflow · key set" : "Quick Capture workflow · no key yet (F2)") : "Capture URL not set",
      status: e.N8N_CAPTURE_URL ? "Configured" : "Not set",
      ok: Boolean(e.N8N_CAPTURE_URL && e.N8N_WEBHOOK_KEY),
    },
    {
      name: "ElevenLabs agent",
      detail: "Server-issued conversation tokens",
      status: e.ELEVENLABS_API_KEY ? "Ready" : "API key missing",
      ok: Boolean(e.ELEVENLABS_API_KEY),
    },
    { name: "Siri & Shortcuts", detail: `${tokens} device token${tokens === 1 ? "" : "s"} for Quick Capture`, status: tokens ? "Ready" : "No tokens", ok: tokens > 0 },
    calendarRow(e.ICLOUD_CALENDAR_URL),
  ];

  return (
    <>
      <PageHeader dateLabel={dateLabel(new Date(), e.APP_TIMEZONE)} title="Settings" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 760 }}>
        <section className="card" style={{ padding: "20px 22px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 className="card-title">Appearance</h2>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Follows your Mac, iPhone or iPad by default.</div>
          </div>
          <AppearanceControl />
        </section>

        <section className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 className="card-title">Integrations</h2>
          {integrations.map((i) => (
            <div key={i.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>{i.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--text2)" }}>{i.detail}</div>
              </div>
              <span className="chip">
                <span className={`dot ${i.ok ? "" : "off"}`} />
                {i.status}
              </span>
            </div>
          ))}
        </section>

        <section className="card" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="card-title">Apple devices</h2>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text2)" }}>
            Install Personal OS from Safari with Share › Add to Home Screen (iPhone, iPad) or File › Add to Dock (Mac). Siri
            Shortcuts and the Action Button can capture tasks through the secured capture endpoint or open the assistant through
            a URL.
          </p>
        </section>

        <form action={signOut}>
          <button type="submit" className="btn">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
