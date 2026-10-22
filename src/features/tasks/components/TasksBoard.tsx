"use client";

import Link from "next/link";
import { PlusIcon, StarIcon } from "@/components/ui/icons";
import { deriveToday, FOCUS_LIMIT } from "../rules";
import type { Task, TaskList } from "../types";
import { CheckButton, TaskMeta, TaskRow } from "./TaskRow";
import { TasksProvider, useTasks } from "./TasksProvider";

const COLUMNS: { key: TaskList; label: string }[] = [
  { key: "today", label: "Heute" },
  { key: "week", label: "Diese Woche" },
  { key: "later", label: "Broader Timeframe" },
];

export function TasksBoard({ tasks, today }: { tasks: Task[]; today: string }) {
  return (
    <TasksProvider tasks={tasks} today={today}>
      <Board />
    </TasksProvider>
  );
}

function Board() {
  const { tasks, toggleFocus } = useTasks();
  const view = deriveToday(tasks);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span className="chip">
          <span className="dot" />
          Synced with Notion · TODOS
        </span>
        <Link href="/?capture=1" className="btn btn-primary">
          <PlusIcon size={16} />
          New task
        </Link>
      </div>

      <section className="card" style={{ padding: "20px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }} aria-labelledby="tf-h">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 8, padding: "0 4px" }}>
          <h2 id="tf-h" className="card-title" style={{ fontSize: 16 }}>
            Top 3{" "}
            <span style={{ fontSize: 12.5, fontWeight: 400, color: "var(--text2)", marginLeft: 6 }}>
              {view.focus.length} of {FOCUS_LIMIT}
            </span>
          </h2>
          <span style={{ fontSize: 12, color: "var(--text2)" }}>Star any task below to change your Top 3</span>
        </div>
        {view.focus.length ? (
          <div className="cols3" style={{ gap: 10 }}>
            {view.focus.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 12px 12px 10px", borderRadius: 16, background: "var(--fill)" }}>
                <CheckButton task={t} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, paddingTop: 4 }}>
                  <span className={t.status === "done" ? "title-done" : ""} style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                    {t.title}
                  </span>
                  <TaskMeta task={t} />
                </div>
                <button type="button" className="mini on" onClick={() => toggleFocus(t)} aria-label="Remove from Top 3">
                  <StarIcon filled />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "14px 6px", fontSize: 13.5, color: "var(--text2)" }}>No focus tasks yet — star up to three below.</div>
        )}
      </section>

      <div className="cols3">
        {COLUMNS.map((c) => (
          <section key={c.key} className="card" style={{ padding: "18px 16px 14px", display: "flex", flexDirection: "column", gap: 10 }} aria-labelledby={`col-${c.key}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px" }}>
              <h2 id={`col-${c.key}`} className="card-title">
                {c.label}
              </h2>
              <span style={{ fontSize: 12.5, color: "var(--text2)" }}>{view.openCount[c.key]} open</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {view.byList[c.key].map((t) => (
                <TaskRow key={t.id} task={t} showDelete meta />
              ))}
              {view.byList[c.key].length === 0 ? (
                <div style={{ padding: "18px 8px", textAlign: "center", fontSize: 13.5, color: "var(--text2)" }}>Nothing here.</div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
