"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUpIcon, CheckIcon, PlusIcon } from "@/components/ui/icons";
import { captureText } from "./actions";

type Status = { kind: "idle" } | { kind: "done"; message: string } | { kind: "error"; message: string };

/**
 * Quick Capture als Feld (sitzt in der Assistant-Karte auf Today): Freitext → n8n D_todo_capture → Notion.
 * Tastenkürzel in der App: ⌘K oder ⌘⇧Space. Deep Link: /?capture=1 (Kurzbefehle, „New task“ auf Tasks).
 */
export function CaptureField() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ohne useSearchParams: das Feld braucht so keine eigene Suspense-Grenze und springt nicht nach.
    if (new URLSearchParams(window.location.search).get("capture") === "1") input.current?.focus();
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
    <div className="capture">
      <form onSubmit={submit} style={{ margin: 0 }} aria-label="Quick Capture">
        <div className="qc-box">
          <span style={{ color: "var(--text3)", display: "grid" }}>
            <PlusIcon size={18} />
          </span>
          <label htmlFor="qc" className="vh">
            Add a task, thought, or idea
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
            placeholder="Add a task, thought, or idea…"
          />
          <span className="hide-sm" style={{ fontSize: 11.5, color: "var(--text3)", letterSpacing: ".04em" }}>
            ⌘K
          </span>
          <button className="send" type="submit" disabled={!text.trim() || pending} aria-label="Add">
            <ArrowUpIcon />
          </button>
        </div>
      </form>
      {pending ? (
        <div className="capture-status">
          <span className="spin" />
          Saving…
        </div>
      ) : status.kind === "done" ? (
        <div className="capture-status" style={{ color: "var(--pos)", animation: "rise .3s ease" }} role="status">
          <CheckIcon size={14} strokeWidth={2.2} />
          {status.message}
        </div>
      ) : status.kind === "error" ? (
        <div className="capture-status" style={{ color: "var(--danger)" }} role="alert">
          {status.message}
        </div>
      ) : null}
    </div>
  );
}
