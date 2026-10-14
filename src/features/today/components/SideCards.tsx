"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, MicIcon, TranscriptIcon } from "@/components/ui/icons";
import { OrbVisual } from "@/components/ui/Orb";
import { ALLOCATION, DEMO_TODAY, DEMO_TOTAL, eur, sparkPaths } from "@/features/investments/mock";
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

export function InvestmentsTeaser() {
  const [hidden, setHidden] = useState(true);
  const spark = sparkPaths();
  return (
    <section className="card" style={{ padding: "20px 22px", display: "flex", flexWrap: "wrap", gap: "20px 32px", alignItems: "center" }} aria-labelledby="inv-h">
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 220px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 id="inv-h" className="card-title">
            Investments
          </h2>
          <span className="chip" style={{ height: 20, fontSize: 10.5 }}>
            Demo data
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>
            {hidden ? "€ ••••••" : eur(DEMO_TOTAL)}
          </div>
          <button type="button" className="mini" onClick={() => setHidden((h) => !h)} aria-label={hidden ? "Show values" : "Hide values"} aria-pressed={hidden}>
            <EyeIcon off={hidden} />
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--pos)", fontWeight: 550 }}>
          {hidden ? `+${DEMO_TODAY.pct}%` : `+${eur(DEMO_TODAY.abs)} (+${DEMO_TODAY.pct}%)`} today · +14.2% 1Y
        </div>
      </div>
      <svg viewBox="0 0 320 90" preserveAspectRatio="none" style={{ flex: "2 1 260px", height: 90, minWidth: 0 }} role="img" aria-label="Portfolio, last 3 months, trending up">
        <path d={spark.area} fill="var(--accentSoft)" />
        <path d={spark.line} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }}>
          {ALLOCATION.map((a) => (
            <span key={a.label} style={{ flex: a.pct, background: a.color }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "4px 12px" }}>
          {ALLOCATION.slice(0, 4).map((a) => (
            <span key={a.label} style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: a.color }} />
              {a.label} {a.pct}%
            </span>
          ))}
        </div>
        <Link href="/investments" className="btn btn-ghost" style={{ alignSelf: "flex-start", height: 24, padding: 0, fontSize: 12.5, color: "var(--accent)" }}>
          View portfolio
        </Link>
      </div>
    </section>
  );
}
