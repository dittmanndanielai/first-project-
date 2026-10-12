import { SimplePage } from "@/features/shell/SimplePage";
import { VoiceLab } from "@/features/voice/VoiceLab";

// Phase-0-Spike: Voice in der installierten Web-App testen. Phase 2 baut daraus den Orb auf Today.
export default function VoicePage() {
  return (
    <SimplePage title="Assistant">
      <VoiceLab />
    </SimplePage>
  );
}
