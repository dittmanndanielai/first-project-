"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MicIcon } from "@/components/ui/icons";
import { CaptureField } from "@/features/capture/CaptureBar";
import { OrbVisual } from "@/components/ui/Orb";
import { LAWS } from "../laws";

/**
 * Assistant + Quick Capture in einem kompakten Modul: Orb (Gespräch auf /voice), darunter das Eingabefeld als
 * schnellster Weg, etwas festzuhalten. Phase 2 verbindet den Orb direkt mit dem Agenten (D3 verschoben).
 */
export function AssistantCard() {
  const talk = (cls: string) => (
    <Link href="/voice" className={`btn btn-sm ${cls}`}>
      <MicIcon size={15} strokeWidth={1.8} />
      Talk
    </Link>
  );
  return (
    <section className="card asst m-assistant" aria-labelledby="ai-h">
      <div className="card-head asst-head">
        <h2 id="ai-h" className="card-title">
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
      <div className="asst-hero">
        <Link href="/voice" className="asst-orb" aria-label="Talk to your assistant">
          <OrbVisual size={104} />
        </Link>
        <div className="asst-copy">
          <p className="asst-title">
            <span className="hide-sm">How can I help you today?</span>
            <span className="show-sm">How can I help?</span>
          </p>
          <p className="asst-sub">
            <span className="hide-sm">Talk to your assistant, or add a task below.</span>
            <span className="show-sm">Talk, or add a task below.</span>
          </p>
        </div>
        {talk("asst-talk-sm")}
      </div>
      <CaptureField />
      <div className="asst-actions">{talk("asst-talk-lg")}</div>
    </section>
  );
}

export function LawCard({ initialIndex }: { initialIndex: number }) {
  const [offset, setOffset] = useState(0);
  const idx = (((initialIndex + offset) % LAWS.length) + LAWS.length) % LAWS.length;
  const when = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : offset === -1 ? "Yesterday" : offset > 0 ? `In ${offset} days` : `${-offset} days ago`;
  return (
    <section className="card law m-law" aria-labelledby="law-h">
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
      <p className="serif law-text" aria-live="polite">
        {LAWS[idx]}
      </p>
      <div className="serif" style={{ fontStyle: "italic", fontSize: 13, color: "var(--text2)" }}>
        {when} · The 48 Laws of Power
      </div>
    </section>
  );
}
