import Link from "next/link";
import { ThemeButton } from "./Nav";

/** Kopfzeile aus dem Design: Datum, großer Titel, rechts Zusammenfassung, Sync-Chip, Theme, Avatar. */
export function PageHeader({
  dateLabel,
  title,
  summary,
  synced = true,
}: {
  dateLabel: string;
  title: string;
  summary?: string;
  synced?: boolean;
}) {
  return (
    <header className="page-header">
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{dateLabel}</div>
        <h1>{title}</h1>
      </div>
      <div className="page-header-right">
        {summary ? (
          <span className="chip hide-sm" style={{ background: "transparent", padding: 0, fontSize: 13 }}>
            {summary}
          </span>
        ) : null}
        <span className={`chip ${synced ? "hide-sm" : ""}`} title={synced ? "Notion reachable" : "Notion not reachable, showing last state"}>
          <span className={`dot ${synced ? "" : "off"}`} />
          {synced ? "Synced" : "Offline"}
        </span>
        <span className="hide-sm">
          <ThemeButton />
        </span>
        <Link
          href="/settings"
          aria-label="Account and settings"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(145deg,#56708F,#2E3E52)",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 600,
            textDecoration: "none",
            flex: "none",
          }}
        >
          DD
        </Link>
      </div>
    </header>
  );
}

export function HeaderSkeleton() {
  return (
    <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="skeleton" style={{ width: 140, height: 14 }} />
      <div className="skeleton" style={{ width: 280, height: 30 }} />
    </header>
  );
}
