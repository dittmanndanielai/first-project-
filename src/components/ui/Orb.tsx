import type { CSSProperties } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/** Der Voice-Orb aus dem Design: geschichtete Gradienten, Zustand ändert Tempo, Glanz und Größe. */
export function OrbVisual({ size, state = "idle", small = false }: { size: number; state?: OrbState; small?: boolean }) {
  const style = { "--s": `${size}px` } as CSSProperties;
  const cls = `orb ${state === "idle" ? "" : state}`;
  if (small) {
    return (
      <span className={cls} style={{ ...style, cursor: "default" }} aria-hidden="true">
        <span
          className="orb-body"
          style={{ boxShadow: "inset 0 -4px 8px rgba(64,72,150,.35), inset 0 2px 6px rgba(255,255,255,.7)" }}
        >
          <span className="blob b1" style={{ filter: "blur(4px)" }} />
          <span className="blob b2" style={{ filter: "blur(4px)" }} />
        </span>
      </span>
    );
  }
  return (
    <span className={cls} style={style} aria-hidden="true">
      <span className="orb-glow" />
      <span className="orb-body">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="b4" />
        <span className="orb-shine" />
        <span className="orb-rim" />
      </span>
    </span>
  );
}
