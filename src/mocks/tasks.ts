import type { Task } from "@/features/tasks/types";
import { addDays } from "@/lib/time";

// Demo-Daten aus dem Design-Artefakt (Personal OS, Board „Desktop — Today“).
// Genutzt bei DATA_SOURCE=mock: lokale Entwicklung und Preview-Deployments ohne Secrets.

// `due`: Deadline relativ zu heute in Tagen (zeigt „Needs attention“ im Demo-Modus).
type Seed = Pick<Task, "title" | "list" | "priority" | "focus" | "status" | "postponed"> & { goal: string; due?: number };

const SEED: Seed[] = [
  { title: "Send Weldstone automation proposal v2", goal: "Weldstone", list: "today", priority: "high", focus: true, status: "open", postponed: 0 },
  { title: "Upload Scalable onboarding documents", goal: "Scalable", list: "today", priority: "medium", focus: true, status: "open", postponed: 0 },
  { title: "Fix n8n Quick Capture retry logic", goal: "Personal OS", list: "today", priority: "medium", focus: true, status: "open", postponed: 1 },
  { title: "Invoice Weldstone — September", goal: "Motion HQ", list: "today", priority: "high", focus: false, status: "done", postponed: 0 },
  { title: "Book train to Munich for 31 Oct", goal: "Personal", list: "today", priority: "low", focus: false, status: "open", postponed: 3 },
  { title: "Outline Pflichtpraktikum report", goal: "Hochschule", list: "week", priority: "medium", focus: false, status: "open", postponed: 0, due: 0 },
  { title: "Prepare Motion HQ roadmap with Patrick", goal: "Motion HQ", list: "week", priority: "medium", focus: false, status: "open", postponed: 0 },
  { title: "Rotate Notion integration token", goal: "Personal OS", list: "week", priority: "low", focus: false, status: "open", postponed: 0, due: -2 },
  { title: "Quarterly portfolio rebalance check", goal: "Finance", list: "week", priority: "low", focus: false, status: "open", postponed: 1 },
  { title: "Research US internship visa routes", goal: "Career", list: "later", priority: "low", focus: false, status: "open", postponed: 0 },
  { title: "Spike: Apple Calendar integration", goal: "Personal OS", list: "later", priority: "low", focus: false, status: "open", postponed: 0 },
  { title: "Clean up Google Drive archive", goal: "Personal", list: "later", priority: "low", focus: false, status: "open", postponed: 4 },
];

export function mockTasks(today: string): Task[] {
  return SEED.map((s, i) => ({
    id: `mock-${i + 1}`,
    url: "https://www.notion.so/",
    title: s.title,
    list: s.list,
    priority: s.priority,
    status: s.status,
    focus: s.focus,
    deadline: s.due === undefined ? null : addDays(today, s.due),
    doneAt: s.status === "done" ? today : null,
    postponed: s.postponed,
    goal: { id: `goal-${s.goal}`, title: s.goal },
    createdBy: "user",
    createdAt: `2026-10-0${(i % 9) + 1}T08:00:00.000Z`,
  }));
}
