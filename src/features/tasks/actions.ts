"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { authedAction, UserError } from "@/lib/action";
import { TAGS } from "@/lib/cache-tags";
import { planComplete, planFocus, planReopen, planReschedule, RuleError } from "./rules";
import { listTasks, patchTask, restoreTask, todayISO, trashTask } from "./store";
import type { Task, TaskPatch } from "./types";

const id = z.string().min(1).max(64);

async function load(taskId: string): Promise<{ task: Task; all: Task[] }> {
  const all = await listTasks();
  const task = all.find((t) => t.id === taskId);
  if (!task) throw new UserError("Task not found. It may have changed in Notion.");
  return { task, all };
}

async function apply(taskId: string, plan: (task: Task, all: Task[]) => TaskPatch) {
  const { task, all } = await load(taskId);
  let patch: TaskPatch;
  try {
    patch = plan(task, all);
  } catch (err) {
    if (err instanceof RuleError) throw new UserError(err.message);
    throw err;
  }
  await patchTask(taskId, patch);
  updateTag(TAGS.tasks);
}

export const completeTask = authedAction("completeTask", z.object({ id }), async (i) =>
  apply(i.id, () => planComplete(todayISO())),
);

export const reopenTask = authedAction("reopenTask", z.object({ id }), async (i) => apply(i.id, () => planReopen()));

export const rescheduleTask = authedAction("rescheduleTask", z.object({ id }), async (i) =>
  apply(i.id, (task) => planReschedule(task)),
);

export const setFocus = authedAction("setFocus", z.object({ id, on: z.boolean() }), async (i) =>
  apply(i.id, (task, all) => planFocus(task, i.on, all)),
);

export const deleteTask = authedAction("deleteTask", z.object({ id }), async (i) => {
  await trashTask(i.id);
  updateTag(TAGS.tasks);
});

export const undoDeleteTask = authedAction("undoDeleteTask", z.object({ id }), async (i) => {
  await restoreTask(i.id);
  updateTag(TAGS.tasks);
});
