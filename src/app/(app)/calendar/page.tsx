import { PlannedCard, SimplePage } from "@/features/shell/SimplePage";

export default function CalendarPage() {
  return (
    <SimplePage title="Calendar">
      <PlannedCard phase="Phase 4 · Google Calendar (read-only iCal)">
        Day and week view with the next event, details and “Ask assistant to prepare”. Data comes from the secret iCal
        address of your Google Calendar, cached for five minutes. Nothing is written to your calendar.
      </PlannedCard>
    </SimplePage>
  );
}
