"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/icons";
import { germanDayLabel } from "@/lib/time";
import type { CardSection, DiscoverCard } from "../types";
import { focusables, prefersReducedMotion, toneClass } from "./client-utils";

export type LearnMoreMode = "sheet" | "drawer" | "panel";

const CLOSE_MS = 300;
const DRAG_CLOSE_PX = 110;
const DRAG_CLOSE_SPEED = 0.6; // px/ms

function isBoxed(s: CardSection) {
  return s.kind === "critique" || s.label === "Chance für dich";
}

function Section({ section }: { section: CardSection }) {
  const lines = section.body.split("\n").filter(Boolean);
  const opinion = section.kind === "analysis" || section.kind === "outlook";
  return (
    <section className={`dc-section ${isBoxed(section) ? "is-boxed" : ""}`}>
      <h3>
        {section.label}
        {opinion ? <span className="dc-tag">Einschätzung</span> : null}
      </h3>
      {lines.length > 1 ? (
        <ul>
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : (
        <p>{section.body}</p>
      )}
    </section>
  );
}

function Details({ card }: { card: DiscoverCard }) {
  const { source } = card;
  return (
    <>
      {card.stat ? (
        <div className={`dc-stat ${toneClass(card)}`}>
          <b>{card.stat.value}</b>
          <span>{card.stat.label}</span>
        </div>
      ) : null}
      {card.sections.map((s) => (
        <Section key={s.label} section={s} />
      ))}
      {card.takeaway ? <p className="dc-takeaway">{card.takeaway}</p> : null}
      <div className="dc-source">
        <strong>{source.name}</strong>
        {source.author ? <span>{source.author}</span> : null}
        {card.date ? <span>Im Digest am {germanDayLabel(card.date)}</span> : null}
        {source.detail ? <span>{source.detail}</span> : null}
        {source.url ? (
          <a className="dc-btn" href={source.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Quelle öffnen
          </a>
        ) : (
          <span>Kein Link zur Quelle vorhanden.</span>
        )}
      </div>
    </>
  );
}

function Head({ card, titleId, onClose, dragProps }: { card: DiscoverCard; titleId: string; onClose: () => void; dragProps?: React.HTMLAttributes<HTMLDivElement> }) {
  return (
    <div className="dc-sheet-head" {...dragProps}>
      <h2 id={titleId}>{card.title}</h2>
      <button type="button" className="dc-close" onClick={onClose} aria-label="Schließen">
        <span>
          <CloseIcon />
        </span>
      </button>
    </div>
  );
}

/** Breiter Mac: Panel rechts neben der Karte, nicht modal. Pfeiltasten blättern weiter, das Panel folgt. */
export function LearnMorePanel({ card, onClose }: { card: DiscoverCard; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const titleId = "dc-more-title";
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [card.id]);
  return (
    <aside ref={ref} className={`dc-panel ${card.feed === "learning" ? "is-learning" : ""}`} aria-labelledby={titleId} tabIndex={-1}>
      <Head card={card} titleId={titleId} onClose={onClose} />
      <div className="dc-sheet-scroll">
        <Details card={card} />
      </div>
    </aside>
  );
}

/**
 * iPhone: Sheet von unten (Griffleiste, Wisch nach unten, Tippen auf den Hintergrund, Esc).
 * Schmaler Mac: dasselbe als Drawer von rechts. Beides modal mit Fokusfalle; der Feed darunter ist gesperrt.
 */
export function LearnMoreSheet({ card, mode, onClosed }: { card: DiscoverCard; mode: "sheet" | "drawer"; onClosed: () => void }) {
  const sheet = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const closing = useRef(false);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const titleId = "dc-more-title";

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    window.setTimeout(onClosed, prefersReducedMotion() ? 0 : CLOSE_MS);
  };

  // Einfahren im nächsten Frame, damit die Transition greift.
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    sheet.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(id);
  }, []);

  // Esc und Fokusfalle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab" || !sheet.current) return;
      const items = focusables(sheet.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = sheet.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  // Wisch nach unten schließt (nur Sheet). Im Inhalt erst, wenn er oben angekommen ist.
  const setDrag = (dy: number) => sheet.current?.style.setProperty("--drag", `${Math.max(0, dy)}px`);
  const start = (y: number) => {
    drag.current = { y, t: performance.now(), dy: 0 };
    sheet.current?.classList.add("is-dragging");
  };
  const move = (y: number) => {
    if (!drag.current) return;
    drag.current.dy = y - drag.current.y;
    setDrag(drag.current.dy);
  };
  const end = () => {
    const d = drag.current;
    drag.current = null;
    sheet.current?.classList.remove("is-dragging");
    if (!d) return;
    const speed = d.dy / Math.max(1, performance.now() - d.t);
    if (d.dy > DRAG_CLOSE_PX || speed > DRAG_CLOSE_SPEED) close();
    else setDrag(0);
  };

  useEffect(() => {
    const el = scroller.current;
    if (!el || mode !== "sheet") return;
    let y0: number | null = null;
    const onStart = (e: TouchEvent) => {
      y0 = el.scrollTop <= 0 ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (y0 === null) return;
      const dy = e.touches[0].clientY - y0;
      if (!drag.current && dy > 6 && el.scrollTop <= 0) start(y0);
      if (drag.current) {
        e.preventDefault(); // Inhalt nicht weiterscrollen, stattdessen das Sheet ziehen
        move(e.touches[0].clientY);
      }
    };
    const onEnd = () => {
      y0 = null;
      end();
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  });

  const dragProps: React.HTMLAttributes<HTMLDivElement> | undefined =
    mode === "sheet"
      ? {
          onPointerDown: (e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            start(e.clientY);
          },
          onPointerMove: (e) => move(e.clientY),
          onPointerUp: end,
          onPointerCancel: end,
        }
      : undefined;

  return createPortal(
    <>
      <div className={`dc-backdrop ${open ? "is-open" : ""}`} onClick={close} aria-hidden="true" />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`dc-sheet ${mode === "drawer" ? "is-drawer" : ""} ${card.feed === "learning" ? "is-learning" : ""} ${open ? "is-open" : ""}`}
      >
        {mode === "sheet" ? (
          <div className="dc-grab" {...dragProps}>
            <span />
          </div>
        ) : null}
        <Head card={card} titleId={titleId} onClose={close} dragProps={dragProps} />
        <div className="dc-sheet-scroll" ref={scroller}>
          <Details card={card} />
        </div>
      </div>
    </>,
    document.body,
  );
}
