"use client";

import { useTheme, type ThemeChoice } from "./theme";

const OPTIONS: { key: ThemeChoice; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

export function AppearanceControl() {
  const { choice, set } = useTheme();
  return (
    <div className="seg" role="radiogroup" aria-label="Appearance">
      {OPTIONS.map((o) => (
        <button key={o.key} type="button" role="radio" aria-checked={choice === o.key} className={choice === o.key ? "on" : ""} onClick={() => set(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
