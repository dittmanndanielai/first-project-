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
