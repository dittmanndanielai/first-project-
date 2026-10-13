import { shortDayLabel } from "@/lib/time";
import { paperDisplay, paperSerif } from "../fonts";
import { TOPIC_LABEL } from "../rules";
import type { Edition, ForYouItem, Section, Story } from "../types";

// Digest-Board aus dem Design: „For you“, „The Daily Brief“ (Economist-Stil), „Markets & Money“ (FT-Stil).
// Inhalte stammen aus Notion „Digest Archive“ (n8n B_news_digest), die Hinweise aus den eigenen Aufgaben.

const SANS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
const SERIF = "var(--font-paper), Georgia, serif";
const DISPLAY = "var(--font-paper-display), Georgia, serif";

function kicker(story: Story): string {
  return story.topics[0] ? TOPIC_LABEL[story.topics[0]] : "News";
}

/** Titel als Link auf den Original-Artikel, falls vorhanden. Aufmacher als h3, Meldungen als span. */
function Headline({ story, style, as: Tag = "span" }: { story: Story; style: React.CSSProperties; as?: "h3" | "span" }) {
  return (
    <Tag style={{ display: "block", ...style }}>
      {story.url ? (
        <a href={story.url} target="_blank" rel="noopener noreferrer" className="paper-title">
          {story.title}
        </a>
      ) : (
        story.title
      )}
    </Tag>
  );
}

export function storiesLabel(n: number): string {
  return `${n} ${n === 1 ? "story" : "stories"}`;
}

export function editionLabel(edition: Edition, today: string): string {
  const run = edition.run === "evening" ? "Evening edition · 17:00" : "Morning edition · 08:00";
  return edition.date === today ? run : `${shortDayLabel(edition.date)} · ${run}`;
}

export function ForYouCard({ items, label }: { items: ForYouItem[]; label: string }) {
  return (
    <section className="card" style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }} aria-labelledby="dg-h">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 id="dg-h" style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>
          For you
        </h2>
        <span style={{ fontSize: 12, color: "var(--text2)" }}>{label}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 10 }}>
        {items.map((i) => (
          <div key={i.title} style={{ padding: "12px 14px", borderRadius: 14, background: "var(--fill)", display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{i.title}</span>
            <span style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.4 }}>{i.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ArchiveLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="paper-link" style={{ marginTop: "auto" }}>
      {children}
    </a>
  );
}

function BriefCard({ section, archiveUrl }: { section: Section | null; archiveUrl: string | null }) {
  const lead = section?.lead;
  return (
    <article
      className="paper"
      aria-label="The Daily Brief"
      style={{
        background: "#FFFFFF",
        color: "#121212",
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,.08)",
        boxShadow: "var(--shadow)",
        display: "flex",
        flexDirection: "column",
        fontFamily: SERIF,
      }}
    >
      <div style={{ height: 6, background: "#E3120B" }} />
      <div style={{ padding: "20px 28px 24px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontFamily: SANS, fontSize: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase" }}>
            <span style={{ width: 10, height: 10, background: "#E3120B" }} />
            The Daily Brief
          </span>
          {lead ? (
            <span style={{ color: "#595959" }}>
              {kicker(lead)} · {lead.sources} {lead.sources === 1 ? "source" : "sources"}
            </span>
          ) : null}
        </div>
        {lead ? (
          <>
            <Headline as="h3" story={lead} style={{ margin: 0, fontSize: 25, lineHeight: 1.14, fontWeight: 700, letterSpacing: "-.012em", textWrap: "balance" }} />
            {lead.takeaway ? <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: "#333333" }}>{lead.takeaway}</p> : null}
            <div style={{ borderTop: "1px solid #121212", marginTop: 2 }} />
            {section.items.map((i) => (
              <div key={i.id} style={{ display: "flex", flexDirection: "column", gap: 3, paddingBottom: 10, borderBottom: "1px solid #E6E6E6" }}>
                <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, color: "#B5100B", letterSpacing: ".08em", textTransform: "uppercase" }}>
                  {kicker(i)}
                </span>
                <Headline story={i} style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.28 }} />
                {i.takeaway ? <span style={{ fontSize: 13.5, color: "#4D4D4D", lineHeight: 1.4 }}>{i.takeaway}</span> : null}
              </div>
            ))}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 15, color: "#4D4D4D" }}>No AI or geopolitics stories in this edition.</p>
        )}
        <ArchiveLink href={archiveUrl}>Open the archive</ArchiveLink>
      </div>
    </article>
  );
}

function MarketsCard({ section, date, archiveUrl }: { section: Section | null; date: string; archiveUrl: string | null }) {
  const lead = section?.lead;
  return (
    <article
      className="paper"
      aria-label="Markets and Money"
      style={{
        background: "#FFF1E5",
        color: "#1A1817",
        borderRadius: 22,
        border: "1px solid rgba(0,0,0,.06)",
        boxShadow: "var(--shadow)",
        padding: "20px 28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: SERIF,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, borderBottom: "2px solid #1A1817", paddingBottom: 8 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, letterSpacing: "-.01em" }}>Markets &amp; Money</span>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: "#66605C" }}>{shortDayLabel(date)}</span>
      </div>
      {lead ? (
        <>
          <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, color: "#990F3D", letterSpacing: ".08em", textTransform: "uppercase" }}>
            {kicker(lead)}
          </span>
          <Headline as="h3" story={lead} style={{ margin: "-4px 0 0", fontFamily: DISPLAY, fontSize: 22, lineHeight: 1.18, fontWeight: 700, textWrap: "balance" }} />
          {lead.takeaway ? <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#33302E" }}>{lead.takeaway}</p> : null}
          {section.items.map((i) => (
            <div key={i.id} style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 10, borderTop: "1px solid #CCC1B7" }}>
              <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, color: "#990F3D", letterSpacing: ".08em", textTransform: "uppercase" }}>
                {kicker(i)}
              </span>
              <Headline story={i} style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 500, lineHeight: 1.28 }} />
            </div>
          ))}
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "#33302E" }}>No economy or venture stories in this edition.</p>
      )}
      <ArchiveLink href={archiveUrl}>Read more in Notion</ArchiveLink>
    </article>
  );
}

export function DigestBoard({
  edition,
  archiveUrl,
  forYou,
  today,
}: {
  edition: Edition;
  archiveUrl: string | null;
  forYou: ForYouItem[];
  today: string;
}) {
  return (
    <div className={`${paperSerif.variable} ${paperDisplay.variable}`} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ForYouCard items={forYou} label={editionLabel(edition, today)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(440px, 100%), 1fr))", gap: 20, alignItems: "stretch" }}>
        <BriefCard section={edition.brief} archiveUrl={archiveUrl} />
        <MarketsCard section={edition.markets} date={edition.date} archiveUrl={archiveUrl} />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text3)", padding: "0 4px" }}>
        {storiesLabel(edition.count)} · delivered by n8n twice a day
        {edition.hidden > 0 && archiveUrl ? (
          <>
            {" · "}
            <a href={archiveUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
              {edition.hidden} more in Notion
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Hinweis statt Board, wenn keine Ausgabe geladen werden konnte. */
export function DigestNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 650 }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text2)" }}>{children}</div>
    </section>
  );
}
