"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, StarIcon } from "@/components/ui/icons";
import { deriveToday, isStale } from "@/features/tasks/rules";
import { CheckButton, TaskMeta, TaskRow } from "@/features/tasks/components/TaskRow";
import { useTasks } from "@/features/tasks/components/TasksProvider";
import type { Task, TaskList } from "@/features/tasks/types";

const TABS: { key: TaskList; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "later", label: "Later" },
];

export function FocusCard() {
  const { tasks, toggleFocus } = useTasks();
  const { focus } = deriveToday(tasks);
  const done = focus.filter((t) => t.status === "done").length;
  const feedback =
    focus.length && done === focus.length
      ? "Top 3 done. Everything else today is a bonus."
      : done > 0
        ? `Nice — ${done} down, ${focus.length - done} to go.`
        : "";

  return (
    <section className="card m-focus" style={{ padding: "20px 18px 16px", display: "flex", flexDirection: "column", gap: 10 }} aria-labelledby="focus-h">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
        <h2 id="focus-h" className="card-title">
          Today&apos;s Focus
        </h2>
        <span style={{ fontSize: 12.5, color: "var(--text2)" }}>
          {done} of {focus.length}
        </span>
      </div>
      {focus.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {focus.map((t) => (
            <div className="row" style={{ padding: "9px 8px" }} key={t.id}>
              <CheckButton task={t} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span className={t.status === "done" ? "title-done" : ""} style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>
                  {t.title}
                </span>
                <TaskMeta task={t} />
              </div>
              <div className="row-actions">
                <button type="button" className="mini on" onClick={() => toggleFocus(t)} aria-label="Remove from Top 3">
                  <StarIcon filled />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "22px 10px", textAlign: "center", color: "var(--text2)", fontSize: 13.5, lineHeight: 1.5 }}>
          No focus tasks yet.
          <br />
          Star up to three tasks to set your day.
        </div>
      )}
      {feedback ? (
        <div
          style={{
            margin: "2px 4px 0",
            padding: "10px 12px",
            borderRadius: 12,
            background: "var(--accentSoft)",
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "rise .35s ease",
          }}
        >
          <CheckIcon size={14} strokeWidth={2.2} className="text-[var(--accent)]" />
          {feedback}
        </div>
      ) : null}
    </section>
  );
}

export function MyTasksCard() {
  const { tasks } = useTasks();
  const [tab, setTab] = useState<TaskList>("today");
  const [reviewing, setReviewing] = useState(false);
  const view = deriveToday(tasks);
  const list = view.byList[tab].slice(0, 6);

  return (
    <section className="card m-tasks" style={{ padding: "20px 18px 14px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }} aria-labelledby="tasks-h">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 4px" }}>
        <h2 id="tasks-h" className="card-title">
          My Tasks
        </h2>
        <button type="button" className="btn btn-ghost" style={{ height: 28, padding: "0 8px", fontSize: 12.5 }} onClick={() => setReviewing((r) => !r)}>
          {reviewing ? "Done" : "Review day"}
        </button>
      </div>
      {reviewing ? (
        <ReviewMode tasks={view.byList.today.filter((t) => t.status === "open")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="seg" role="tablist" aria-label="Timeframe" style={{ alignSelf: "flex-start" }}>
            {TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>
                {t.label} <span style={{ opacity: 0.6 }}>{view.openCount[t.key]}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {list.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
            {list.length === 0 ? (
              <div style={{ padding: "24px 8px", textAlign: "center", fontSize: 13.5, color: "var(--text2)" }}>All clear here.</div>
            ) : null}
          </div>
          <Link href="/tasks" className="btn btn-ghost" style={{ alignSelf: "flex-start", height: 28, padding: "0 6px", fontSize: 12.5, color: "var(--accent)" }}>
            Open all tasks
          </Link>
        </div>
      )}
    </section>
  );
}

/** Tagesreview aus dem Design: eine Aufgabe nach der anderen entscheiden. */
function ReviewMode({ tasks }: { tasks: Task[] }) {
  const { toggleDone, reschedule, toggleFocus, remove } = useTasks();
  // Entschiedene IDs merken, damit die Liste nicht springt, wenn Notion nachzieht.
  const [decided, setDecided] = useState<string[]>([]);
  const open = tasks.filter((t) => !decided.includes(t.id));
  const task = open[0];
  const pos = decided.length + 1;
  const total = decided.length + open.length;
  const next = (fn?: () => boolean | void) => {
    if (!task) return;
    if (fn && fn() === false) return;
    setDecided((d) => [...d, task.id]);
  };

  if (!task) {
    return (
      <div style={{ padding: "20px 8px", textAlign: "center", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accentSoft)", display: "grid", placeItems: "center", color: "var(--accent)" }}>
          <CheckIcon size={16} strokeWidth={2.2} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Review complete</div>
        <div style={{ fontSize: 12.5, color: "var(--text2)" }}>Today&apos;s list is decided.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 4px 6px" }}>
      <div style={{ fontSize: 12, color: "var(--text2)" }}>
        Daily review · {pos} of {total}
      </div>
      <div style={{ padding: 16, borderRadius: 16, background: "var(--fill)", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{task.title}</div>
        <TaskMeta task={task} />
        {isStale(task) ? <div style={{ fontSize: 12, color: "var(--warn)" }}>Postponed {task.postponed} times. Time to decide.</div> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
        <button type="button" className="btn btn-primary" onClick={() => next(() => toggleDone(task))}>
          Complete
        </button>
        <button type="button" className="btn" onClick={() => next()}>
          Keep
        </button>
        <button type="button" className="btn" onClick={() => next(() => reschedule(task))}>
          Reschedule
        </button>
        <button type="button" className="btn" onClick={() => next(() => (task.focus ? true : toggleFocus(task)))}>
          Top 3
        </button>
        <button type="button" className="btn" style={{ gridColumn: "span 2" }} onClick={() => next(() => remove(task))}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function ProgressCard() {
  const { tasks } = useTasks();
  const { progress } = deriveToday(tasks);
  const circumference = 213.6;
  return (
    <section className="card m-progress" style={{ padding: 20, display: "flex", alignItems: "center", gap: 18 }} aria-labelledby="pr-h">
      <div style={{ position: "relative", width: 84, height: 84, flex: "none" }}>
        <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${progress.done} of ${progress.total} tasks done`}>
          <circle cx="42" cy="42" r="34" fill="none" stroke="var(--fill)" strokeWidth="8" />
          <circle
            cx="42"
            cy="42"
            r="34"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={(circumference * (1 - progress.pct)).toFixed(1)}
            transform="rotate(-90 42 42)"
            style={{ transition: "stroke-dashoffset .8s cubic-bezier(.3,1,.4,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(progress.pct * 100)}%
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <h2 id="pr-h" className="card-title">
          Daily Progress
        </h2>
        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{progress.done} completed</span> · {progress.left} remaining
        </div>
      </div>
    </section>
  );
}
