import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";
import { N8nError, postToN8n } from "@/lib/n8n";
import { isoDate } from "@/lib/time";
import { mockAddTask } from "@/features/tasks/store";

// Quick Capture: eine Funktion für Web-App (Server Action) und Siri/Mac (/api/capture).
// Das Sprachverständnis (1–5 Aufgaben, Liste, Deadline, Prio) macht n8n D_todo_capture + SUB_llm.

export const captureInput = z.object({
  text: z.string().trim().min(1).max(1500),
  liste: z.enum(["heute", "diese woche", "später"]).optional(),
});
export type CaptureInput = z.infer<typeof captureInput>;

// Antwortformat von D_todo_capture ("Antwort bauen"): { ok, nachricht, anzahl, fallback }
const n8nAnswer = z.object({
  ok: z.boolean(),
  nachricht: z.string(),
  anzahl: z.number().optional().default(0),
  fallback: z.boolean().optional().default(false),
});
export type CaptureResult = z.infer<typeof n8nAnswer>;

export async function capture(input: CaptureInput): Promise<CaptureResult> {
  const e = env();
  if (!e.N8N_CAPTURE_URL) {
    if (e.DATA_SOURCE !== "mock") throw new N8nError(503, "N8N_CAPTURE_URL fehlt");
    return mockCapture(input);
  }
  const raw = await postToN8n(e.N8N_CAPTURE_URL, input);
  const parsed = n8nAnswer.safeParse(raw);
  if (!parsed.success) throw new N8nError(502, "unexpected n8n answer");
  return parsed.data;
}

function mockCapture(input: CaptureInput): CaptureResult {
  const list = input.liste === "heute" ? "today" : input.liste === "später" ? "later" : "week";
  const now = new Date();
  mockAddTask({
    id: `mock-${now.getTime()}`,
    url: "https://www.notion.so/",
    title: input.text.slice(0, 120),
    list,
    priority: null,
    status: "open",
    focus: false,
    deadline: null,
    doneAt: null,
    postponed: 0,
    goal: null,
    createdBy: "user",
    createdAt: now.toISOString(),
  });
  return { ok: true, nachricht: `Notiert (Demo): ${input.text.slice(0, 60)}`, anzahl: 1, fallback: false };
}

export function captureToday(): string {
  return isoDate(new Date(), env().APP_TIMEZONE);
}
