import type { Metadata } from "next";
import { OrbVisual } from "@/components/ui/Orb";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · Personal OS" };

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
      <section
        className="card"
        style={{ width: "100%", maxWidth: 380, padding: "36px 28px 28px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}
      >
        <OrbVisual size={96} />
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>Personal OS</h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text2)" }}>Sign in to continue</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
