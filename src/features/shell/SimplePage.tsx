import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { dateLabel } from "@/lib/time";
import { HeaderSkeleton, PageHeader } from "./PageHeader";

/** Seitenrahmen für Seiten ohne eigene Datenabfrage: Session prüfen, Kopfzeile, Inhalt. */
export function SimplePage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <Frame title={title}>{children}</Frame>
    </Suspense>
  );
}

async function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  await requireSession();
  return (
    <>
      <PageHeader dateLabel={dateLabel(new Date(), env().APP_TIMEZONE)} title={title} />
      {children}
    </>
  );
}

export function PlannedCard({ phase, children }: { phase: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
      <span className="chip" style={{ alignSelf: "flex-start" }}>
        <span className="dot off" />
        {phase}
      </span>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text2)" }}>{children}</div>
    </section>
  );
}
