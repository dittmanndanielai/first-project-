"use client";

import { CheckIcon, ExternalIcon, RescheduleIcon, StarIcon, SunIcon, TrashIcon } from "@/components/ui/icons";
import { isStale, nextList } from "../rules";
import type { Task } from "../types";
import { LIST_LABEL, useTasks } from "./TasksProvider";

const PRIO_LABEL = { high: "High", medium: "Medium", low: "Low" } as const;

export function CheckButton({ task }: { task: Task }) {
  const { toggleDone } = useTasks();
  const done = task.status === "done";
  return (
    <button
      type="button"
      className={`check ${done ? "on" : ""}`}
      onClick={() => toggleDone(task)}
      aria-label={`${done ? "Reopen" : "Complete"} ${task.title}`}
      aria-pressed={done}
    >
      <span>
        <CheckIcon />
      </span>
    </button>
  );
}

export function TaskMeta({ task, extra }: { task: Task; extra?: string }) {
  const parts = [task.goal?.title, extra].filter(Boolean);
  return (
    <span style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
      <span
        className={`p p-${task.priority ?? "none"}`}
        title={task.priority ? `${PRIO_LABEL[task.priority]} priority` : "No priority"}
      />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{parts.join(" · ")}</span>
      {isStale(task) ? <span style={{ color: "var(--warn)", whiteSpace: "nowrap" }}>· {task.postponed}× postponed</span> : null}
    </span>
  );
}

export function RowActions({ task, showDelete = false }: { task: Task; showDelete?: boolean }) {
  const { toggleFocus, reschedule, move, remove } = useTasks();
  const open = task.status === "open";
  const later = nextList(task.list);
  return (
    <div className="row-actions">
      {open && task.list !== "today" ? (
        <button type="button" className="mini" onClick={() => move(task, "today")} aria-label="Move to Today" title="Move to Today">
          <SunIcon size={16} />
        </button>
      ) : null}
      <button
        type="button"
        className={`mini ${task.focus ? "on" : ""}`}
        onClick={() => toggleFocus(task)}
        aria-label={task.focus ? "Remove from Top 3" : "Add to Top 3"}
        title={task.focus ? "Remove from Top 3" : "Add to Top 3"}
        aria-pressed={task.focus}
      >
        <StarIcon filled={task.focus} />
      </button>
      {open && later !== task.list ? (
        <button type="button" className="mini" onClick={() => reschedule(task)} aria-label={`Move to ${LIST_LABEL[later]}`} title={`Move to ${LIST_LABEL[later]}`}>
          <RescheduleIcon />
        </button>
      ) : null}
      {showDelete ? (
        <button type="button" className="mini" onClick={() => remove(task)} aria-label="Delete">
          <TrashIcon />
        </button>
      ) : null}
      <a className="mini" href={task.url} target="_blank" rel="noreferrer" aria-label="Open in Notion" title="Open in Notion">
        <ExternalIcon />
      </a>
    </div>
  );
}

/** Zeile in „My Tasks“ und den Spalten der Tasks-Seite. */
export function TaskRow({ task, showDelete, meta = false }: { task: Task; showDelete?: boolean; meta?: boolean }) {
  const done = task.status === "done";
  return (
    <div className="row">
      <CheckButton task={task} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          className={done ? "title-done" : ""}
          style={{ fontSize: 13.5, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          title={task.title}
        >
          {task.title}
        </span>
        {meta && (task.goal?.title || task.focus || isStale(task)) ? (
          // Tasks-Seite: „Personal · Top 3 · 3× postponed“
          <TaskMeta task={task} extra={task.focus ? "Top 3" : undefined} />
        ) : !meta && isStale(task) ? (
          // Today/My Tasks: Entscheidung einfordern wie im Design
          <span style={{ fontSize: 11.5, color: "var(--warn)" }}>Postponed {task.postponed}× — keep, move or drop?</span>
        ) : null}
      </div>
      <RowActions task={task} showDelete={showDelete} />
    </div>
  );
}
