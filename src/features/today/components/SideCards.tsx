"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MicIcon, TranscriptIcon } from "@/components/ui/icons";
import { OrbVisual } from "@/components/ui/Orb";
import { LAWS } from "../laws";

/** Assistant-Karte. Phase 2 verbindet den Orb mit dem ElevenLabs-Agenten; bis dahin führt Start zum Voice-Test. */
export function AssistantCard() {
  return (
    <section
      className="card m-assistant"
      style={{ padding: "28px 24px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, position: "relative", overflow: "hidden", flex: 1 }}
      aria-labelledby="ai-h"
    >
      <div className="hide-sm" style={{ position: "absolute", top: 16, right: 18 }}>
        <h2 id="ai-h" className="vh">
          Assistant
        </h2>
        <span className="chip" style={{ gap: 8 }}>
          <span className="bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          Ready
        </span>
      </div>
      <div className="orb-stage" style={{ height: 268, display: "grid", placeItems: "center", marginTop: 6 }}>
        <Link href="/voice" aria-label="Start conversation" style={{ borderRadius: "50%" }}>
          <OrbVisual size={216} />
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 58, maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontSize: 21, fontWeight: 650, letterSpacing: "-.02em" }}>
          <span className="hide-sm">How can I help you today?</span>
          <span className="show-sm">Talk to your assistant</span>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.45 }}>
          <span className="hide-sm">Talk to your assistant</span>
          <span className="show-sm">Tap the orb, or hold the Action Button.</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/voice" className="ctrl" aria-label="Microphone">
          <MicIcon />
        </Link>
        <Link href="/voice" className="ctrl ctrl-main on">
          <span className="hide-sm" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <MicIcon size={16} strokeWidth={1.8} />
            Start conversation
          </span>
          <span className="show-sm">Talk</span>
        </Link>
        <Link href="/voice" className="ctrl" aria-label="Transcript">
          <TranscriptIcon />
        </Link>
      </div>
    </section>
  );
}

export function LawCard({ initialIndex }: { initialIndex: number }) {
  const [offset, setOffset] = useState(0);
  const idx = (((initialIndex + offset) % LAWS.length) + LAWS.length) % LAWS.length;
  const when = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : offset === -1 ? "Yesterday" : offset > 0 ? `In ${offset} days` : `${-offset} days ago`;
  return (
    <section className="card m-law" style={{ padding: "20px 22px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }} aria-labelledby="law-h">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 id="law-h" style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".09em" }}>
          Law {idx + 1}
        </h2>
        <div style={{ display: "flex", gap: 2 }}>
          <button type="button" className="mini" onClick={() => setOffset((o) => o - 1)} aria-label="Previous law">
            <ChevronLeftIcon />
          </button>
          <button type="button" className="mini" onClick={() => setOffset((o) => o + 1)} aria-label="Next law">
            <ChevronRightIcon />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <p className="serif" style={{ margin: 0, fontSize: 26, lineHeight: 1.12, textWrap: "balance" }} aria-live="polite">
          {LAWS[idx]}
        </p>
      </div>
      <div className="serif" style={{ fontStyle: "italic", fontSize: 14, color: "var(--text2)" }}>
        {when} · The 48 Laws of Power
      </div>
    </section>
  );
}
