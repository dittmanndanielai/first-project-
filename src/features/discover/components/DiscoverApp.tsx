"use client";

import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/features/shell/Toast";
import { categoriesOf, filterCards } from "../rules";
import type { DiscoverCard, DiscoverFeed, IntelligenceStatus } from "../types";
import { loadRelevant, loadSaved, prefersReducedMotion, saveRelevant, saveSaved, useMedia } from "./client-utils";
import { FeedCard, StateCard, type RelevantState } from "./FeedCard";
import { LearnMorePanel, LearnMoreSheet } from "./LearnMore";

// Discover: vertikaler Card-Feed mit nativem Scroll-Snap. Der ganze Feed kommt mit der Seite; Swipen lädt nichts.
// Kein Endlos-Nachladen: jeder Feed endet mit einer Abschlusskarte.

type Props = {
  intelligence: DiscoverCard[];
  status: IntelligenceStatus;
  learning: DiscoverCard[];
  nextDigest: string; // „heute um 17:00“
  today: string;
};

const FEEDS: { key: DiscoverFeed; label: string }[] = [
  { key: "intelligence", label: "Intelligence" },
  { key: "learning", label: "Learning" },
];

const REVEAL_FROM = 0.15; // Anteil, ab dem die nächste Karte einblendet
const WHEEL_STEP = 24; // px Wheel-Weg, ab dem eine Geste als Blättern zählt
const WHEEL_GAP_MS = 180; // so lange Ruhe trennt zwei Gesten (Trackpad-Momentum läuft ohne Pause weiter)

type Open = { id: string; opener: HTMLElement | null } | null;

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && !!target.closest("input, textarea, select, [contenteditable='true']");
}

export function DiscoverApp({ intelligence, status, learning, nextDigest, today }: Props) {
  const router = useRouter();
  const toast = useToast();
  const feedRef = useRef<HTMLDivElement>(null);
  const [feed, setFeed] = useState<DiscoverFeed>("intelligence");
  const [category, setCategory] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const [open, setOpen] = useState<Open>(null);
  const [relevant, setRelevant] = useState<Record<string, RelevantState>>({});
  const [hints, setHints] = useState(true);
  const [ready, setReady] = useState(false);
  const restoreTo = useRef<string | null | undefined>(undefined); // undefined = nichts wiederherstellen

  const isPhone = useMedia("(max-width: 760px)");
  const isWide = useMedia("(min-width: 1100px)");
  const mode = isPhone ? "sheet" : isWide ? "panel" : "drawer";

  const source = feed === "intelligence" ? intelligence : learning;
  const cards = useMemo(() => filterCards(source, category), [source, category]);
  const categories = useMemo(() => categoriesOf(source), [source]);
  const stateOnly = feed === "intelligence" && status !== "ok"; // Fehler, Leer, nicht geteilt
  const total = stateOnly ? 1 : cards.length + 1; // + Abschlusskarte
  const openCard = open ? cards.find((c) => c.id === open.id) : undefined;
  const modal = !!openCard && mode !== "panel";

  // Gespeicherten Stand lesen (nach der Hydration, damit Server- und Client-HTML übereinstimmen).
  useLayoutEffect(() => {
    const saved = loadSaved();
    const ids = loadRelevant(today);
    /* eslint-disable react-hooks/set-state-in-effect -- einmaliges Übernehmen aus localStorage nach der Hydration */
    if (saved.feed === "intelligence" || saved.feed === "learning") setFeed(saved.feed);
    if (saved.hints === false) setHints(false);
    if (ids.length) setRelevant(Object.fromEntries(ids.map((id) => [id, "on" as const])));
    restoreTo.current = saved.pos?.[saved.feed ?? "intelligence"] ?? null;
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [today]);

  // Position wiederherstellen bzw. nach Feed- oder Filterwechsel nach oben.
  useLayoutEffect(() => {
    const el = feedRef.current;
    if (!el || !ready) return;
    const wanted = restoreTo.current;
    restoreTo.current = undefined;
    const index = wanted ? Math.max(0, cards.findIndex((c) => c.id === wanted)) : 0;
    el.scrollTop = index * el.clientHeight;
    setActive(index);
    if (cards[index]) setSeen((prev) => new Set(prev).add(cards[index].id));
  }, [ready, feed, category, cards]);

  // Aktive Karte aus der Scrollposition (alle Karten sind genau so hoch wie der Feed).
  const persist = useRef<number | undefined>(undefined);
  const onScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el || el.clientHeight === 0) return;
    const pos = el.scrollTop / el.clientHeight;
    const index = Math.min(total - 1, Math.round(pos));
    setActive(index);
    const reveal = [Math.floor(pos), pos % 1 > REVEAL_FROM ? Math.ceil(pos) : -1].flatMap((i) => (cards[i] ? [cards[i].id] : []));
    setSeen((prev) => (reveal.every((id) => prev.has(id)) ? prev : new Set([...prev, ...reveal])));
    window.clearTimeout(persist.current);
    persist.current = window.setTimeout(() => {
      const id = cards[index]?.id;
      if (id) saveSaved({ pos: { [feed]: id } });
    }, 250);
  }, [cards, feed, total]);

  const go = useCallback(
    (index: number, focus = true) => {
      const el = feedRef.current;
      if (!el) return;
      const i = Math.max(0, Math.min(total - 1, index));
      el.scrollTo({ top: i * el.clientHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      if (focus) el.querySelector<HTMLElement>(`[data-index="${i}"]`)?.focus({ preventScroll: true });
    },
    [total],
  );

  // Mac: eine Wheel- oder Trackpad-Geste = genau eine Karte. scroll-snap-stop allein verhindert in Chromium
  // keine Mehrfachsprünge (gemessen: ein Ruck von 2400 px sprang 4 Karten). Touch bleibt vollständig nativ.
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    let sum = 0;
    let last = 0;
    let stepped = false;
    let target = 0;
    let settleAt = 0; // bis dahin läuft das Scrollen zur letzten Zielkarte noch
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // Zoom und Querscrollen nicht anfassen
      e.preventDefault();
      const now = performance.now();
      if (now - last > WHEEL_GAP_MS) {
        sum = 0;
        stepped = false;
        if (now > settleAt) target = Math.round(el.scrollTop / el.clientHeight);
      }
      last = now;
      if (stepped) return; // Rest derselben Geste (Momentum) schlucken
      sum += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(sum) < WHEEL_STEP) return;
      stepped = true;
      target = Math.max(0, Math.min(total - 1, target + Math.sign(sum)));
      settleAt = now + 700;
      el.scrollTo({ top: target * el.clientHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [total]);

  const switchFeed = useCallback(
    (next: DiscoverFeed) => {
      if (next === feed) return;
      setOpen(null);
      setCategory(null);
      restoreTo.current = loadSaved().pos?.[next] ?? null;
      setFeed(next);
      saveSaved({ feed: next });
    },
    [feed],
  );

  const chooseCategory = (next: string | null) => {
    setOpen(null);
    setCategory(next);
  };

  const openMore = useCallback((card: DiscoverCard, opener: HTMLElement | null) => {
    if (card.depth !== "full" || card.sections.length === 0) return;
    setOpen({ id: card.id, opener });
  }, []);

  const returnFocus = useRef<HTMLElement | null>(null);
  const closeMore = useCallback(() => {
    returnFocus.current = open?.opener ?? null;
    setOpen(null);
  }, [open]);

  // Fokus zurück an den Auslöser, sobald der Feed nicht mehr inert ist.
  useEffect(() => {
    if (open || !returnFocus.current) return;
    returnFocus.current.focus({ preventScroll: true });
    returnFocus.current = null;
  }, [open]);

  const relevantRef = useRef(relevant);
  useEffect(() => {
    relevantRef.current = relevant;
  }, [relevant]);
  const markRelevant = useCallback(
    async (card: DiscoverCard) => {
      const storyId = card.storyId;
      if (card.feed !== "intelligence" || !storyId || relevantRef.current[card.id]) return;
      setRelevant((r) => ({ ...r, [card.id]: "pending" }));
      const keep = (persistIt: boolean) => {
        setRelevant((r) => {
          const next = { ...r, [card.id]: "on" as const };
          if (persistIt) saveRelevant(today, Object.keys(next).filter((k) => next[k] === "on"));
          return next;
        });
      };
      const undo = (text: string) => {
        setRelevant((r) => {
          const next = { ...r };
          delete next[card.id];
          return next;
        });
        toast(text);
      };
      try {
        const res = await fetch("/api/discover/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId }),
        });
        const data = (await res.json().catch(() => ({}))) as { status?: string };
        if (res.ok && data.status === "ok") keep(true);
        else if (res.ok && data.status === "already") {
          keep(true);
          toast("Heute schon als relevant gezählt");
        } else if (res.ok && data.status === "dry-run") {
          keep(false);
          toast("Dry-Run: nicht gespeichert");
        } else if (res.status === 401) undo("Abgemeldet. Bitte neu anmelden.");
        else if (res.status === 404) undo("Diese Story ist nicht mehr im Archiv.");
        else undo("Nicht gespeichert. Bitte später erneut versuchen.");
      } catch {
        undo("Keine Verbindung. Nicht gespeichert.");
      }
    },
    [today, toast],
  );

  const activeCard = !stateOnly ? cards[active] : undefined;

  // Tastatur (MacBook): ↑/↓ j/k blättern, Enter mehr, o Quelle, r Relevant, Esc schließen, 1/2 Feed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (modal) return; // das Sheet behandelt Esc und Tab selbst
      const target = e.target as HTMLElement;
      const inPanel = !!target.closest?.(".dc-panel");
      switch (e.key) {
        case "ArrowDown":
        case "j":
          if (inPanel && e.key === "ArrowDown") return;
          e.preventDefault();
          go(active + 1);
          break;
        case "ArrowUp":
        case "k":
          if (inPanel && e.key === "ArrowUp") return;
          e.preventDefault();
          go(active - 1);
          break;
        case "Enter":
          if (target.closest("button, a")) return;
          if (activeCard) {
            e.preventDefault();
            openMore(activeCard, feedRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`) ?? null);
          }
          break;
        case "o":
          if (activeCard?.source.url) window.open(activeCard.source.url, "_blank", "noopener,noreferrer");
          break;
        case "r":
          if (activeCard) void markRelevant(activeCard);
          break;
        case "Escape":
          if (open) closeMore();
          break;
        case "1":
          switchFeed("intelligence");
          break;
        case "2":
          switchFeed("learning");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, activeCard, closeMore, go, markRelevant, modal, open, openMore, switchFeed]);

  // Panel (breiter Mac) folgt der aktiven Karte; ohne Details schließt es.
  useEffect(() => {
    if (!open || mode !== "panel" || !activeCard || activeCard.id === open.id) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- folgt der Scrollposition */
    setOpen(activeCard.depth === "full" && activeCard.sections.length ? { id: activeCard.id, opener: null } : null);
  }, [activeCard, mode, open]);

  const hideHints = () => {
    setHints(false);
    saveSaved({ hints: false });
  };

  const restart = () => {
    saveSaved({ pos: { [feed]: cards[0]?.id } });
    go(0);
  };

  const label = feed === "intelligence" ? "Intelligence" : "Learning";
  const progress = !stateOnly && active < cards.length ? `${active + 1} / ${cards.length}` : "";

  return (
    <div className={`dc ${ready ? "is-ready" : ""}`} inert={modal}>
      <header className="dc-head">
        <h1 className="dc-h1">Discover</h1>
        <div className="dc-head-row">
          <div className="dc-seg" role="group" aria-label="Feed">
            {FEEDS.map((f) => (
              <button key={f.key} type="button" aria-pressed={feed === f.key} onClick={() => switchFeed(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="dc-progress" aria-live="polite">
            {progress}
          </span>
        </div>
        {!stateOnly && categories.length > 1 ? (
          <div className="dc-chips" role="group" aria-label="Kategorie">
            <button type="button" className="dc-chip" aria-pressed={category === null} onClick={() => chooseCategory(null)}>
              Alle
            </button>
            {categories.map((c) => (
              <button key={c} type="button" className="dc-chip" aria-pressed={category === c} onClick={() => chooseCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <div className="dc-stage">
        <div className="dc-column">
          <div ref={feedRef} className={`dc-feed ${modal ? "is-locked" : ""}`} role="feed" aria-label={label} aria-busy={false} onScroll={onScroll}>
            {stateOnly ? (
              <StateCard index={0} total={1} {...stateText(status)} actions={[{ label: "Weiter mit Learning", onClick: () => switchFeed("learning"), primary: status !== "error" }, ...(status === "error" ? [{ label: "Erneut versuchen", onClick: () => startTransition(() => router.refresh()), primary: true }] : [])]} />
            ) : (
              <>
                {cards.map((card, i) => (
                  <FeedCard key={card.id} card={card} index={i} total={total} seen={seen.has(card.id)} relevant={relevant[card.id]} onMore={openMore} onRelevant={markRelevant} />
                ))}
                {feed === "intelligence" ? (
                  <StateCard
                    index={cards.length}
                    total={total}
                    title="Du bist auf dem Stand."
                    text={`Der nächste Digest kommt ${nextDigest}.`}
                    actions={[{ label: "Weiter mit Learning", onClick: () => switchFeed("learning"), primary: true }]}
                  />
                ) : (
                  <StateCard
                    index={cards.length}
                    total={total}
                    title="Alle Karten gesehen"
                    text={`${cards.length} ${cards.length === 1 ? "Karte" : "Karten"} aus der Learning-Bibliothek. Neue kommen nur, wenn die Bibliothek wächst.`}
                    actions={[{ label: "Von vorn beginnen", onClick: restart, primary: true }]}
                  />
                )}
              </>
            )}
          </div>
          {hints ? (
            <div className="dc-hints" aria-hidden="true">
              <span>
                <kbd>↑↓</kbd> blättern · <kbd>Enter</kbd> mehr · <kbd>o</kbd> Quelle
                {feed === "intelligence" ? <> · <kbd>r</kbd> Relevant</> : null} · <kbd>1</kbd>/<kbd>2</kbd> Feed
              </span>
              <button type="button" onClick={hideHints} tabIndex={-1}>
                Ausblenden
              </button>
            </div>
          ) : null}
        </div>
        {openCard && mode === "panel" ? <LearnMorePanel card={openCard} onClose={closeMore} /> : null}
      </div>
      {openCard && mode !== "panel" ? <LearnMoreSheet key={openCard.id} card={openCard} mode={mode} onClosed={closeMore} /> : null}
    </div>
  );
}

function stateText(status: IntelligenceStatus): { title: string; text: string } {
  if (status === "empty") return { title: "Keine neuen Stories", text: "In den letzten 7 Tagen kam nichts aus dem Digest. Die Learning-Bibliothek ist immer da." };
  if (status === "not_shared")
    return { title: "Digest Archive nicht verbunden", text: "In Notion das Digest Archive mit der Connection „Personal OS Web“ teilen. Bis dahin bleibt Intelligence leer." };
  return { title: "Gerade nicht erreichbar", text: "Notion antwortet nicht. Learning funktioniert weiter." };
}
