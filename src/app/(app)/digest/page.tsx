import { Suspense } from "react";
import { requireSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { logError } from "@/lib/log";
import { dateLabel, isoDate } from "@/lib/time";
import { DigestBoard, DigestNotice, editionLabel, ForYouCard, storiesLabel } from "@/features/digest/components/DigestBoard";
import { forYou } from "@/features/digest/rules";
import { getDigest } from "@/features/digest/store";
import type { Edition } from "@/features/digest/types";
import { HeaderSkeleton, PageHeader } from "@/features/shell/PageHeader";
import { listTasks } from "@/features/tasks/store";
import type { Task } from "@/features/tasks/types";

export default function DigestPage() {
  return (
    <Suspense fallback={<DigestSkeleton />}>
      <Digest />
    </Suspense>
  );
}

async function Digest() {
  await requireSession();
  const e = env();
  const now = new Date();
  const today = isoDate(now, e.APP_TIMEZONE);

  const [digest, tasks] = await Promise.all([
    getDigest(),
    listTasks().catch((err): Task[] => {
      logError("digest.tasks", err);
      return [];
    }),
  ]);
  const hints = forYou(tasks, today);

  const header = (summary?: string, synced = true) => (
    <PageHeader dateLabel={dateLabel(now, e.APP_TIMEZONE)} title="Intelligence Digest" summary={summary} synced={synced} />
  );

  if (digest.status === "ok") {
    const { editions, archiveUrl } = digest;
    const shown = [editions.morning, editions.evening].filter((ed): ed is Edition => ed !== null);
    const total = shown.reduce((n, ed) => n + ed.count, 0);
    return (
      <>
        {header(`${storiesLabel(total)} · ${shown.length === 2 ? "morning and evening" : editionLabel(shown[0], today)}`)}
        <DigestBoard editions={editions} archiveUrl={archiveUrl} forYou={hints} today={today} />
      </>
    );
  }

  return (
    <>
      {header(undefined, digest.status !== "error")}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {digest.status === "not_shared" ? (
          <DigestNotice title="Connect the Digest Archive">
            In Notion, open 🗞️ Digest Archive, then ••• › Connections and add “Personal OS Web”. The app only reads it; n8n keeps
            writing the stories.
          </DigestNotice>
        ) : digest.status === "empty" ? (
          <DigestNotice title="No digest yet">
            No stories in the last three days. The n8n digest runs daily at 08:00 and 17:00.
          </DigestNotice>
        ) : (
          <DigestNotice title="Digest unavailable">Notion did not respond. Try again in a minute.</DigestNotice>
        )}
        <ForYouCard items={hints} label="From your tasks" />
      </div>
    </>
  );
}

function DigestSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="card skeleton" style={{ height: 150 }} />
        <div className="skeleton" style={{ width: 170, height: 32, borderRadius: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(440px, 100%), 1fr))", gap: 20 }}>
          <div className="card skeleton" style={{ height: 520 }} />
          <div className="card skeleton" style={{ height: 520 }} />
        </div>
      </div>
    </>
  );
}
