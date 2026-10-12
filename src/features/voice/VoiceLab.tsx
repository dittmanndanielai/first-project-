"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CloseIcon, MicIcon, TranscriptIcon } from "@/components/ui/icons";
import { OrbVisual, type OrbState } from "@/components/ui/Orb";

// Voice-Spike (Phase 0) und Grundlage für den Orb in Phase 2:
// prüft Mikrofon + WebRTC im installierten Home-Bildschirm-Modus auf dem iPhone.

type Line = { id: number; who: "you" | "ai"; text: string };

export function VoiceLab() {
  return (
    <ConversationProvider>
      <Lab />
    </ConversationProvider>
  );
}

// iOS: navigator.standalone, sonst display-mode. Ändert sich während der Laufzeit nicht.
const noopSubscribe = () => () => {};
function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone) || window.matchMedia("(display-mode: standalone)").matches;
}

type TokenResponse = { token?: string; error?: string; reason?: string; upstream?: number };

function errorText(data: TokenResponse, httpStatus: number): string {
  // Code in Klammern hilft bei der Fehlersuche, ohne Interna preiszugeben.
  const detail = data.reason ?? data.upstream ?? httpStatus;
  switch (data.error) {
    case "voice_not_configured":
      return "ELEVENLABS_API_KEY is not set on the server.";
    case "limit_reached":
      return "The agent's daily limit is reached.";
    case "unauthorized":
      return "Session expired. Please sign in again.";
    case "forbidden":
      return "Request blocked: please open the app from its own address.";
    case "key_rejected":
      return `ElevenLabs rejected the API key. Check its ElevenAgents permission (${detail}).`;
    case "agent_not_found":
      return `ElevenLabs does not know this agent for this API key. Same workspace? (${detail})`;
    default:
      return `Could not start the conversation (${detail}).`;
  }
}

function Lab() {
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mic, setMic] = useState<"unknown" | "granted" | "denied">("unknown");
  const standalone = useSyncExternalStore(noopSubscribe, isStandalone, () => false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [thinking, setThinking] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onMessage: (m) => {
      setLines((l) => [...l, { id: m.event_id * 2 + (m.role === "user" ? 0 : 1), who: m.role === "user" ? "you" : "ai", text: m.message }]);
      setThinking(m.role === "user");
    },
    onModeChange: ({ mode }) => {
      if (mode === "speaking") setThinking(false);
    },
    onAgentToolRequest: () => setThinking(true),
    onError: (message) => setError(message),
    onDisconnect: (d) => {
      setThinking(false);
      if (d.reason === "error") setError(d.message);
    },
  });

  const { status, isSpeaking, isMuted, setMuted } = conversation;
  const active = status === "connected" || status === "connecting";
  const orbState: OrbState = !active ? "idle" : isSpeaking ? "speaking" : thinking ? "thinking" : "listening";

  // Audio-reaktiver Orb: Pegel als CSS-Variable, ohne React-Re-Render pro Frame.
  useEffect(() => {
    if (status !== "connected") return;
    const el = orbRef.current;
    let raf = 0;
    const tick = () => {
      const level = isSpeaking ? conversation.getOutputVolume() : conversation.getInputVolume();
      el?.style.setProperty("--level", Math.min(1, level * 1.6).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el?.style.setProperty("--level", "0");
    };
  }, [status, isSpeaking, conversation]);

  async function start() {
    setError(null);
    setLines([]);
    try {
      // Muss direkt aus dem Tap kommen (iOS verlangt eine Nutzergeste fürs Mikrofon).
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMic("granted");
    } catch {
      setMic("denied");
      setError("Microphone access was denied. Allow it in Settings › Safari › Microphone.");
      return;
    }
    const res = await fetch("/api/voice/token", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as TokenResponse;
    if (!res.ok || !data.token) {
      setError(errorText(data, res.status));
      return;
    }
    conversation.startSession({ conversationToken: data.token, connectionType: "webrtc", useWakeLock: true });
  }

  const headline = !active
    ? "How can I help you today?"
    : status === "connecting"
      ? "Connecting…"
      : isMuted
        ? "Microphone muted"
        : orbState === "speaking"
          ? "Speaking"
          : orbState === "thinking"
            ? "Thinking…"
            : "Listening…";
  const last = lines.at(-1)?.text;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 760 }}>
      <section className="card" style={{ padding: "28px 24px 26px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div ref={orbRef} style={{ height: 268, display: "grid", placeItems: "center" }}>
          <button type="button" onClick={active ? () => conversation.endSession() : start} aria-label={active ? "End conversation" : "Start conversation"} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", borderRadius: "50%" }}>
            <OrbVisual size={216} state={orbState} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 58, maxWidth: 440, textAlign: "center" }}>
          <div style={{ fontSize: 21, fontWeight: 650, letterSpacing: "-.02em" }} aria-live="polite">
            {headline}
          </div>
          <div style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.45 }}>{active ? last ?? "Go ahead, I’m listening." : "Tap the orb to talk to your assistant."}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className={`ctrl ${isMuted ? "on" : ""}`} onClick={() => setMuted(!isMuted)} disabled={!active} aria-label={isMuted ? "Unmute microphone" : "Mute microphone"} aria-pressed={isMuted}>
            <MicIcon muted={isMuted} />
          </button>
          {active ? (
            <button type="button" className="ctrl ctrl-main ctrl-end" onClick={() => conversation.endSession()}>
              <CloseIcon />
              End
            </button>
          ) : (
            <button type="button" className="ctrl ctrl-main on" onClick={start}>
              <MicIcon size={16} strokeWidth={1.8} />
              Start conversation
            </button>
          )}
          <button type="button" className={`ctrl ${showTranscript ? "on" : ""}`} onClick={() => setShowTranscript((s) => !s)} aria-label="Transcript" aria-pressed={showTranscript}>
            <TranscriptIcon />
          </button>
        </div>
        {error ? (
          <div role="alert" style={{ fontSize: 13, color: "var(--danger)", textAlign: "center" }}>
            {error}
          </div>
        ) : null}
        {showTranscript ? (
          <div style={{ alignSelf: "stretch", borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
            <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>Transcript</div>
            {lines.map((l) => (
              <div key={l.id} className={`line ${l.who === "you" ? "line-you" : "line-ai"}`}>
                {l.text}
              </div>
            ))}
            {lines.length === 0 ? <div style={{ fontSize: 13, color: "var(--text2)", padding: "8px 0" }}>No messages yet.</div> : null}
          </div>
        ) : null}
      </section>

      <section className="card" style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: 13 }}>
        <span style={{ color: "var(--text2)" }}>Home screen app</span>
        <span>{standalone ? "yes (standalone)" : "no (browser tab)"}</span>
        <span style={{ color: "var(--text2)" }}>Microphone</span>
        <span>{mic}</span>
        <span style={{ color: "var(--text2)" }}>Connection</span>
        <span>{status}</span>
      </section>
    </div>
  );
}
