"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const KEY = "pos-theme";
const listeners = new Set<() => void>();

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function systemDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    /* Speicher gesperrt: Theme gilt nur bis zum Neuladen */
  }
  if (choice === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
  };
}

/** Aktuelle Wahl und ob gerade dunkel dargestellt wird. */
export function useTheme() {
  const choice = useSyncExternalStore(subscribe, read, () => "system" as ThemeChoice);
  const isDark = useSyncExternalStore(
    subscribe,
    () => (choice === "system" ? systemDark() : choice === "dark"),
    () => false,
  );
  const toggle = useCallback(() => applyTheme(isDark ? "light" : "dark"), [isDark]);
  return { choice, isDark, toggle, set: applyTheme };
}
