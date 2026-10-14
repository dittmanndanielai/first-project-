import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { isoDate } from "@/lib/time";
import { DiscoverApp } from "@/features/discover/components/DiscoverApp";
import { DiscoverSkeleton } from "@/features/discover/components/DiscoverSkeleton";
import { LEARNING_CARDS } from "@/features/discover/learning-content";
import { nextDigestLabel } from "@/features/discover/rules";
import { getIntelligenceFeed } from "@/features/discover/store";

// Inhalte fassen Paywall-Artikel zusammen: erst die Session prüfen (in Suspense), dann Daten laden.
// So landet nichts davon im prerenderten statischen Shell.
export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <Discover />
    </Suspense>
  );
}

async function Discover() {
  await requireSession();
  const e = env();
  const now = new Date();
  const { status, cards } = await getIntelligenceFeed();
  return (
    <DiscoverApp
      intelligence={cards}
      status={status}
      learning={LEARNING_CARDS}
      nextDigest={nextDigestLabel(now, e.APP_TIMEZONE)}
      today={isoDate(now, e.APP_TIMEZONE)}
    />
  );
}
