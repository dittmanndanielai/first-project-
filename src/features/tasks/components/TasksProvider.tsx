"use client";

import { createContext, startTransition, useContext, useOptimistic, useState } from "react";
import { ChoiceSheet, type Choice } from "@/components/ui/ChoiceSheet";
import type { ActionResult } from "@/lib/action";
import { useToast } from "@/features/shell/Toast";
import {
  completeTask,
  deleteTask,
  moveTask,
  reopenTask,
  replaceFocus as replaceFocusAction,
  rescheduleTask,
  setFocus,
  undoDeleteTask,
} from "../actions";
import {
  applyPatch,
  attentionFor,
  FocusFullError,
  isActiveFocus,
  nextList,
  planComplete,
  planFocus,
  planMove,
  planReopen,
  planReplaceFocus,
  planReschedule,
  RuleError,
  sortTasks,
} from "../rules";
import type { Task, TaskList, TaskPatch } from "../types";

type Op =
  | { type: "patch"; id: string; patch: TaskPatch }
  | { type: "patches"; patches: { id: string; patch: TaskPatch }[] }
  | { type: "remove"; id: string }
  | { type: "add"; task: Task };

function reduce(state: Task[], op: Op): Task[] {
  switch (op.type) {
    case "patch":
      return state.map((t) => (t.id === op.id ? applyPatch(t, op.patch) : t));
    case "patches":
      return op.patches.reduce((s, p) => reduce(s, { type: "patch", ...p }), state);
    case "remove":
      return state.filter((t) => t.id !== op.id);
    case "add":
      return state.some((t) => t.id === op.task.id) ? state : [...state, op.task];
  }
}

export const LIST_LABEL: Record<TaskList, string> = { today: "Today", week: "This Week", later: "Later" };

type Api = {
  tasks: Task[];
  today: string;
  toggleDone: (task: Task) => void;
  reschedule: (task: Task) => void;
  move: (task: Task, list: TaskList) => void;
  /** Top 3 an/aus. Ist Top 3 voll, öffnet sich „Ersetzen“; Rückgabe true, wenn sofort gesetzt. */
  toggleFocus: (task: Task) => boolean;
  /** Auswahl einer neuen Priorität (freier Top-3-Platz). */
  pickFocus: () => void;
  remove: (task: Task) => void;
};

const Ctx = createContext<Api | null>(null);

export function useTasks(): Api {
  const api = useContext(Ctx);
  if (!api) throw new Error("useTasks outside TasksProvider");
  return api;
}

type Sheet = { mode: "replace"; add: Task } | { mode: "pick" } | null;

const URGENT = new Set(["overdue", "dueToday", "focusOffToday"]);

/** Kandidaten für einen freien Top-3-Platz: offene Aufgaben auf Heute zuerst, dann dringende aus anderen Listen. */
function focusCandidates(tasks: Task[], today: string): Task[] {
  const open = tasks.filter((t) => t.status === "open" && !isActiveFocus(t));
  const onToday = sortTasks(open.filter((t) => t.list === "today"));
  const urgent = open.filter((t) => t.list !== "today" && URGENT.has(attentionFor(t, today)?.reason ?? ""));
  return [...onToday, ...urgent].slice(0, 8);
}

/**
 * Hält die Aufgabenliste für Today/Tasks. Änderungen erscheinen sofort (useOptimistic);
 * die Server Action schreibt nach Notion und invalidiert den Cache. Schlägt sie fehl,
 * springt die Anzeige automatisch auf den Serverstand zurück und ein Toast erklärt es.
 */
export function TasksProvider({ tasks, today, children }: { tasks: Task[]; today: string; children: React.ReactNode }) {
  const [optimistic, update] = useOptimistic(tasks, reduce);
  const [sheet, setSheet] = useState<Sheet>(null);
  const toast = useToast();

  function run(op: Op, action: () => Promise<ActionResult<unknown>>, success?: string, undo?: () => void) {
    startTransition(async () => {
      update(op);
      const res = await action();
      if (!res.ok) toast(res.error);
      else if (success) toast(success, undo ? { label: "Undo", onClick: undo } : undefined);
    });
  }

  function addFocus(task: Task): boolean {
    let patch: TaskPatch;
    try {
      patch = planFocus(task, true, optimistic);
    } catch (err) {
      if (err instanceof FocusFullError) {
        setSheet({ mode: "replace", add: task });
        return false;
      }
      if (err instanceof RuleError) {
        toast(err.message);
        return false;
      }
      throw err;
    }
    run({ type: "patch", id: task.id, patch }, () => setFocus({ id: task.id, on: true }), "Added to Top 3");
    return true;
  }

  function replace(add: Task, removeId: string) {
    const remove = optimistic.find((t) => t.id === removeId);
    if (!remove) return;
    let plan: ReturnType<typeof planReplaceFocus>;
    try {
      plan = planReplaceFocus(add, remove, optimistic);
    } catch (err) {
      if (err instanceof RuleError) return toast(err.message);
      throw err;
    }
    run(
      { type: "patches", patches: [{ id: remove.id, patch: plan.remove }, { id: add.id, patch: plan.add }] },
      () => replaceFocusAction({ add: add.id, remove: remove.id }),
      "Top 3 updated",
    );
  }

  const api: Api = {
    tasks: optimistic,
    today,
    toggleDone(task) {
      if (task.status === "done") {
        run({ type: "patch", id: task.id, patch: planReopen() }, () => reopenTask({ id: task.id }));
        return;
      }
      // Undo stellt auch den Top-3-Platz wieder her; ob Platz ist, prüft der Server mit frischen Daten.
      const wasFocus = isActiveFocus(task);
      const undo = () =>
        run({ type: "patch", id: task.id, patch: { ...planReopen(), ...(wasFocus ? { focus: true } : {}) } }, () =>
          reopenTask({ id: task.id, restoreFocus: wasFocus }),
        );
      run({ type: "patch", id: task.id, patch: planComplete(today) }, () => completeTask({ id: task.id }), "Completed · synced to Notion", undo);
    },
    reschedule(task) {
      const to = nextList(task.list);
      if (to === task.list) return;
      run({ type: "patch", id: task.id, patch: planReschedule(task) }, () => rescheduleTask({ id: task.id }), `Moved to ${LIST_LABEL[to]}`);
    },
    move(task, list) {
      if (list === task.list) return;
      run(
        { type: "patch", id: task.id, patch: planMove(task, list, optimistic) },
        () => moveTask({ id: task.id, list }),
        `Moved to ${LIST_LABEL[list]}`,
      );
    },
    toggleFocus(task) {
      if (!task.focus) return addFocus(task);
      run({ type: "patch", id: task.id, patch: { focus: false } }, () => setFocus({ id: task.id, on: false }), "Removed from Top 3");
      return true;
    },
    pickFocus() {
      setSheet({ mode: "pick" });
    },
    remove(task) {
      run({ type: "remove", id: task.id }, () => deleteTask({ id: task.id }), "Task deleted", () =>
        run({ type: "add", task }, () => undoDeleteTask({ id: task.id })),
      );
    },
  };

  const active = sortTasks(optimistic.filter(isActiveFocus));
  const choices: Choice[] =
    sheet?.mode === "replace"
      ? active.map((t) => ({ id: t.id, label: t.title, detail: t.goal?.title || undefined }))
      : sheet?.mode === "pick"
        ? focusCandidates(optimistic, today).map((t) => ({
            id: t.id,
            label: t.title,
            detail: t.list === "today" ? t.goal?.title || undefined : `${attentionFor(t, today)?.label ?? LIST_LABEL[t.list]} · moves to Today`,
          }))
        : [];

  return (
    <Ctx.Provider value={api}>
      {children}
      <ChoiceSheet
        open={sheet !== null}
        title={sheet?.mode === "replace" ? "Top 3 is full" : "Add a priority"}
        message={sheet?.mode === "replace" ? `Replace one priority with “${sheet.add.title}”.` : "Pick what matters most today."}
        choices={choices}
        empty="No open tasks on Today. Capture one first."
        onClose={() => setSheet(null)}
        onChoose={(id) => {
          const current = sheet;
          setSheet(null);
          if (current?.mode === "replace") replace(current.add, id);
          else {
            const task = optimistic.find((t) => t.id === id);
            if (task) addFocus(task);
          }
        }}
      />
    </Ctx.Provider>
  );
}
