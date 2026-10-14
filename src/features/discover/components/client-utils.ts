"use client";

import { useSyncExternalStore } from "react";
import { CATEGORY } from "../intelligence";
import type { DiscoverCard, DiscoverFeed } from "../types";

// Kleine Helfer für die Discover-Oberfläche: Speicher (nur Komfort, alles in try/catch), Media Queries, Farben.

const TONE: Record<string, string> = {
  [CATEGORY.ai]: "tone-ai",
  [CATEGORY.economy]: "tone-economy",
  [CATEGORY.geopolitics]: "tone-geopolitics",
  [CATEGORY.vc]: "tone-vc",
};

export function toneClass(card: DiscoverCard): string {
  return card.feed === "learning" ? "tone-learning" : (TONE[card.category] ?? "");
}

export type Saved = { feed?: DiscoverFeed; pos?: Partial<Record<DiscoverFeed, string>>; hints?: boolean };

const KEY = "pos-discover";
const RELEVANT_KEY = "pos-discover-relevant";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* gesperrter Speicher: Discover funktioniert ohne */
  }
}

export function loadSaved(): Saved {
  const s = read<Saved>(KEY);
  return s && typeof s === "object" ? s : {};
}

export function saveSaved(patch: Saved) {
  const prev = loadSaved();
  write(KEY, { ...prev, ...patch, pos: { ...prev.pos, ...patch.pos } });
}

/** „Relevant“ für heute (nur Anzeige; maßgeblich ist der Server). */
export function loadRelevant(today: string): string[] {
  const s = read<{ day: string; ids: string[] }>(RELEVANT_KEY);
  return s && s.day === today && Array.isArray(s.ids) ? s.ids : [];
}

export function saveRelevant(today: string, ids: string[]) {
  write(RELEVANT_KEY, { day: today, ids });
}

export function useMedia(query: string, server = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => server,
  );
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fokussierbare Elemente in einem Container (Fokusfalle des Sheets). */
export function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(
    (el) => !el.hasAttribute("inert") && el.offsetParent !== null,
  );
}
