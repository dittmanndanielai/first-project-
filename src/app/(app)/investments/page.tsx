import { PlannedCard, SimplePage } from "@/features/shell/SimplePage";

export default function InvestmentsPage() {
  return (
    <SimplePage title="Investments">
      <PlannedCard phase="Phase 4b · data source to be decided">
        Scalable Capital offers no public API for private portfolios. Proposed path: positions maintained in Notion plus a
        daily price snapshot via n8n (D_depot_snapshot). Until then the dashboard shows demo data.
      </PlannedCard>
    </SimplePage>
  );
}
