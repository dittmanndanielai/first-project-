"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUpIcon, CheckIcon, PlusIcon } from "@/components/ui/icons";
import { captureText } from "./actions";

type Status = { kind: "idle" } | { kind: "done"; message: string } | { kind: "error"; message: string };

/**
 * Quick Capture: Freitext → n8n D_todo_capture (Sprachverständnis) → Notion.
 * Tastenkürzel in der App: ⌘K oder ⌘⇧Space. Deep Link: /?capture=1
 */
export function CaptureBar({ autoFocusParam = true }: { autoFocusParam?: boolean }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const params = useSearchParams();

  useEffect(() => {
    if (autoFocusParam && params.get("capture") === "1") input.current?.focus();
  }, [params, autoFocusParam]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key.toLowerCase() === "k" || (e.shiftKey && e.code === "Space"))) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || pending) return;
    startTransition(async () => {
      const res = await captureText({ text: value });
      if (res.ok && res.data.ok) {
        setText("");
        setStatus({ kind: "done", message: res.data.nachricht });
        setTimeout(() => setStatus({ kind: "idle" }), 4000);
      } else {
        setStatus({ kind: "error", message: res.ok ? res.data.nachricht : res.error });
      }
    });
  }

  return (
    <section className="card m-capture" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4 }} aria-label="Quick Capture">
      <form onSubmit={submit} style={{ margin: 0 }}>
        <div className="qc-box">
          <span style={{ color: "var(--text3)", display: "grid" }}>
            <PlusIcon size={18} />
          </span>
          <label htmlFor="qc" className="vh">
            Capture a thought, task, or idea
          </label>
          <input
            id="qc"
            ref={input}
            className="qc-input"
            autoComplete="off"
            enterKeyHint="send"
            maxLength={1500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Capture a thought, task, or idea…"
          />
          <span className="hide-sm" style={{ fontSize: 11.5, color: "var(--text3)", letterSpacing: ".04em" }}>
            ⌘K
          </span>
          <button className="send" type="submit" disabled={!text.trim() || pending} aria-label="Capture">
            <ArrowUpIcon />
          </button>
        </div>
      </form>
      {pending ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text2)", padding: "2px 16px 8px" }}>
          <span className="spin" />
          Saving…
        </div>
      ) : status.kind === "done" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--pos)", padding: "2px 16px 8px", animation: "rise .3s ease" }} role="status">
          <CheckIcon size={14} strokeWidth={2.2} />
          {status.message}
        </div>
      ) : status.kind === "error" ? (
        <div style={{ fontSize: 12.5, color: "var(--danger)", padding: "2px 16px 8px" }} role="alert">
          {status.message}
        </div>
      ) : null}
    </section>
  );
}
