"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { ExternalIcon, ThumbIcon } from "@/components/ui/icons";
import { germanDayLabel } from "@/lib/time";
import { isEconomist } from "../intelligence";
import type { DiscoverCard } from "../types";
import { toneClass } from "./client-utils";

export type RelevantState = "on" | "pending" | undefined;

type Props = {
  card: DiscoverCard;
  index: number;
  total: number;
  seen: boolean;
  relevant: RelevantState;
  onMore: (card: DiscoverCard, opener: HTMLElement) => void;
  onRelevant: (card: DiscoverCard) => void;
};

const LEAD_LINES = [8, 6, 5, 4, 3];

/**
 * Vorderseite ohne Scrollen: passt der Inhalt nicht, fallen erst Punkte weg (von hinten), dann wird der Lead
 * auf weniger Zeilen gekürzt. Misst direkt im DOM, ohne Re-Render; ein ResizeObserver rechnet bei neuer Höhe neu.
 */
function useFitToCard(dep: unknown) {
  const body = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = body.current;
    const inner = content.current;
    if (!box || !inner) return;
    const fit = () => {
      const points = [...inner.querySelectorAll<HTMLElement>("[data-point]")];
      const list = inner.querySelector<HTMLElement>("[data-points]");
      const lead = inner.querySelector<HTMLElement>("[data-lead]");
      const overflows = () => inner.offsetHeight > box.clientHeight + 1;
      points.forEach((p) => (p.hidden = false));
      if (list) list.hidden = false;
      lead?.classList.remove("is-clamped");
      lead?.style.removeProperty("-webkit-line-clamp");
      let shown = points.length;
      while (overflows() && shown > 0) points[--shown].hidden = true;
      if (list && shown === 0) list.hidden = true;
      for (const lines of LEAD_LINES) {
        if (!lead || !overflows()) break;
        lead.classList.add("is-clamped");
        lead.style.setProperty("-webkit-line-clamp", String(lines));
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [dep]);
  return { body, content };
}

function meta(card: DiscoverCard): string {
  if (card.feed === "learning") return [card.source.author, card.source.name].filter(Boolean).join(" · ");
  return [card.source.name, card.date ? `Im Digest am ${germanDayLabel(card.date)}` : null].filter(Boolean).join(" · ");
}

/** Memoisiert: beim Kartenwechsel rendert nur die Karte neu, deren Zustand sich ändert (gemessen bei 124 Karten). */
export const FeedCard = memo(function FeedCard({ card, index, total, seen, relevant, onMore, onRelevant }: Props) {
  const { body, content } = useFitToCard(card);
  const economist = card.feed === "intelligence" && isEconomist(card.storyId);
  const full = card.depth === "full" && card.sections.length > 0;
  const titleId = `dc-t-${index}`;
  const classes = [
    "dc-card",
    toneClass(card),
    economist ? "is-economist" : "",
    card.feed === "learning" ? "is-learning" : "",
    seen ? "is-seen" : "",
  ];

  return (
    <article className={classes.filter(Boolean).join(" ")} aria-posinset={index + 1} aria-setsize={total} aria-labelledby={titleId} tabIndex={-1} data-index={index}>
      <div className="dc-face">
        <div className="dc-body" ref={body}>
          <div className="dc-content" ref={content}>
            {economist ? <div className="dc-wordmark">The Economist</div> : null}
            <div className="dc-eyebrow">
              <span>{card.category}</span>
              {card.impact === "high" ? <span className="dc-impact">Hoher Impact</span> : null}
            </div>
            <h2 id={titleId} className="dc-title">
              {card.title}
            </h2>
            {card.stat ? (
              <div className="dc-stat">
                <b>{card.stat.value}</b>
                <span>{card.stat.label}</span>
              </div>
            ) : null}
            {card.lead ? (
              <p className="dc-lead" data-lead="">
                {card.lead}
              </p>
            ) : null}
            {card.points?.length ? (
              <ul className="dc-points" data-points="">
                {card.points.map((p) => (
                  <li key={p} data-point="">
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="dc-meta">{meta(card)}</div>
          </div>
        </div>
        <div className={`dc-actions ${full ? "" : "is-thin"}`}>
          {full ? (
            <button type="button" className="dc-more" onClick={(e) => onMore(card, e.currentTarget)}>
              Mehr lesen
            </button>
          ) : null}
          {card.source.url ? (
            <a className="dc-act" href={card.source.url} target="_blank" rel="noopener noreferrer" aria-label={`Quelle öffnen: ${card.source.name}`}>
              <ExternalIcon size={20} />
              Quelle
            </a>
          ) : (
            <button type="button" className="dc-act" disabled aria-label={`Quelle: ${card.source.name}, kein Link vorhanden`}>
              <ExternalIcon size={20} />
              Quelle
            </button>
          )}
          {card.feed === "intelligence" && card.storyId ? (
            <button
              type="button"
              className={`dc-act ${relevant ? "is-on" : ""}`}
              aria-pressed={!!relevant}
              disabled={!!relevant}
              onClick={() => onRelevant(card)}
            >
              <ThumbIcon filled={!!relevant} />
              {relevant ? "Relevant ✓" : "Relevant"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
});

type StateProps = {
  index: number;
  total: number;
  title: string;
  text: string;
  actions: { label: string; onClick: () => void; primary?: boolean }[];
};

/** Ruhige Karte für Ende, Fehler und Leerstand. */
export function StateCard({ index, total, title, text, actions }: StateProps) {
  const titleId = `dc-t-${index}`;
  return (
    <article className="dc-card dc-state is-seen" aria-posinset={index + 1} aria-setsize={total} aria-labelledby={titleId} tabIndex={-1} data-index={index}>
      <div className="dc-face">
        <div className="dc-body">
          <div className="dc-content">
            <h2 id={titleId}>{title}</h2>
            <p>{text}</p>
            <div className="dc-buttons">
              {actions.map((a) => (
                <button key={a.label} type="button" className={`dc-btn ${a.primary ? "is-primary" : ""}`} onClick={a.onClick}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
