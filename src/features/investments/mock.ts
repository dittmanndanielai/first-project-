// Demo-Portfolio aus dem Design. Bleibt Mock, bis der Datenpfad (Phase 4b) entschieden ist.

export const ALLOCATION = [
  { label: "World ETF", pct: 62, color: "#4A6A8C" },
  { label: "EM ETF", pct: 12, color: "#7E9BBA" },
  { label: "Stocks", pct: 16, color: "#9A90C4" },
  { label: "Crypto", pct: 4, color: "#B9A98C" },
  { label: "Cash", pct: 6, color: "#B4B9C3" },
];

export const DEMO_TOTAL = 18420.55;
export const DEMO_TODAY = { abs: 109.84, pct: 0.6 };

function series(n: number, trend: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(1 + trend * t + 0.012 * Math.sin(i * 0.9 + seed) + 0.008 * Math.sin(i * 0.31 + seed * 2) - 0.006 * Math.cos(i * 1.7));
  }
  return out;
}

/** SVG-Pfade für Linie und Fläche (gleiche Formel wie im Design). */
export function sparkPaths(width = 320, height = 90, pad = 8) {
  const arr = series(60, 0.058, 1.3);
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const sx = width / (arr.length - 1);
  const line = arr
    .map((v, i) => `${i ? "L" : "M"}${(i * sx).toFixed(1)} ${(pad + (height - 2 * pad) * (1 - (v - min) / (max - min || 1))).toFixed(1)}`)
    .join(" ");
  return { line, area: `${line} L ${width} ${height} L 0 ${height} Z` };
}

export function eur(v: number) {
  return "€" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
