"use client";

import { useState } from "react";
import type { EditionRun } from "../types";

export type EditionTab = { run: EditionRun; label: string; count: number; caption: string; panel: React.ReactNode | null };

/** Umschalter Morning/Evening. Beide Ausgaben sind bereits gerendert, Umschalten braucht keinen Server. */
export function EditionTabs({ tabs, initial }: { tabs: EditionTab[]; initial: EditionRun }) {
  const [active, setActive] = useState(initial);
  const caption = tabs.find((t) => t.run === active)?.caption;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px 12px", flexWrap: "wrap", padding: "0 4px" }}>
        <div className="seg" role="tablist" aria-label="Edition">
          {tabs.map((t) => (
            <button
              key={t.run}
              id={`dg-tab-${t.run}`}
              type="button"
              role="tab"
              aria-selected={active === t.run}
              aria-controls={t.panel ? `dg-panel-${t.run}` : undefined}
              disabled={!t.panel}
              title={t.panel ? undefined : t.caption}
              className={active === t.run ? "on" : ""}
              onClick={() => setActive(t.run)}
            >
              {t.label} {t.panel ? <span style={{ opacity: 0.6 }}>{t.count}</span> : null}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--text2)" }}>{caption}</span>
      </div>
      {tabs.map((t) =>
        t.panel ? (
          <div key={t.run} id={`dg-panel-${t.run}`} role="tabpanel" aria-labelledby={`dg-tab-${t.run}`} hidden={active !== t.run}>
            {t.panel}
          </div>
        ) : null,
      )}
    </div>
  );
}
