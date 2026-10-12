import { PlannedCard, SimplePage } from "@/features/shell/SimplePage";

export default function DigestPage() {
  return (
    <SimplePage title="Intelligence Digest">
      <PlannedCard phase="Phase 4 · Digest Archive in Notion">
        Today&apos;s stories from the existing n8n digest (B_news_digest writes them to the Notion “Digest Archive”), grouped
        into The Daily Brief and Markets &amp; Money, plus “For you” hints from your tasks and calendar. No new crawler.
      </PlannedCard>
    </SimplePage>
  );
}
