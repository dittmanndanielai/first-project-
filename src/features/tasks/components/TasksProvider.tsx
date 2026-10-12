"use client";

import { createContext, startTransition, useContext, useOptimistic } from "react";
import type { ActionResult } from "@/lib/action";
import { useToast } from "@/features/shell/Toast";
import {
  completeTask,
  deleteTask,
  moveTask,
  reopenTask,
  rescheduleTask,
  setFocus,
  undoDeleteTask,
} from "../actions";
import { applyPatch, nextList, planComplete, planFocus, planMove, planReopen, planReschedule, RuleError } from "../rules";
import type { Task, TaskList, TaskPatch } from "../types";

type Op = { type: "patch"; id: string; patch: TaskPatch } | { type: "remove"; id: string } | { type: "add"; task: Task };

function reduce(state: Task[], op: Op): Task[] {
  switch (op.type) {
    case "patch":
      return state.map((t) => (t.id === op.id ? applyPatch(t, op.patch) : t));
    case "remove":
      return state.filter((t) => t.id !== op.id);
    case "add":
      return state.some((t) => t.id === op.task.id) ? state : [...state, op.task];
  }
}

const LIST_LABEL: Record<TaskList, string> = { today: "Today", week: "This Week", later: "Broader Timeframe" };

type Api = {
  tasks: Task[];
  today: string;
  toggleDone: (task: Task) => void;
  reschedule: (task: Task) => void;
  move: (task: Task, list: TaskList) => void;
  toggleFocus: (task: Task) => boolean;
  remove: (task: Task) => void;
};

const Ctx = createContext<Api | null>(null);

export function useTasks(): Api {
  const api = useContext(Ctx);
  if (!api) throw new Error("useTasks outside TasksProvider");
  return api;
}

/**
 * Hält die Aufgabenliste für Today/Tasks. Änderungen erscheinen sofort (useOptimistic);
 * die Server Action schreibt nach Notion und invalidiert den Cache. Schlägt sie fehl,
 * springt die Anzeige automatisch auf den Serverstand zurück und ein Toast erklärt es.
 */
export function TasksProvider({ tasks, today, children }: { tasks: Task[]; today: string; children: React.ReactNode }) {
  const [optimistic, update] = useOptimistic(tasks, reduce);
  const toast = useToast();

  function run(op: Op, action: () => Promise<ActionResult<unknown>>, success?: string, undo?: () => void) {
    startTransition(async () => {
      update(op);
      const res = await action();
      if (!res.ok) toast(res.error);
      else if (success) toast(success, undo ? { label: "Undo", onClick: undo } : undefined);
    });
  }

  const api: Api = {
    tasks: optimistic,
    today,
    toggleDone(task) {
      if (task.status === "done") run({ type: "patch", id: task.id, patch: planReopen() }, () => reopenTask({ id: task.id }));
      else run({ type: "patch", id: task.id, patch: planComplete(today) }, () => completeTask({ id: task.id }), "Completed · synced to Notion");
    },
    reschedule(task) {
      const to = nextList(task.list);
      run({ type: "patch", id: task.id, patch: planReschedule(task) }, () => rescheduleTask({ id: task.id }), `Moved to ${LIST_LABEL[to]}`);
    },
    move(task, list) {
      run({ type: "patch", id: task.id, patch: planMove(task, list) }, () => moveTask({ id: task.id, list }), `Moved to ${LIST_LABEL[list]}`);
    },
    toggleFocus(task) {
      const on = !task.focus;
      let patch: TaskPatch;
      try {
        patch = planFocus(task, on, optimistic);
      } catch (err) {
        if (err instanceof RuleError) {
          toast(err.message);
          return false;
        }
        throw err;
      }
      run({ type: "patch", id: task.id, patch }, () => setFocus({ id: task.id, on }), on ? "Added to Top 3" : "Removed from Top 3");
      return true;
    },
    remove(task) {
      run({ type: "remove", id: task.id }, () => deleteTask({ id: task.id }), "Task deleted", () =>
        run({ type: "add", task }, () => undoDeleteTask({ id: task.id })),
      );
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
