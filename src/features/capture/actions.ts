"use server";

import { updateTag } from "next/cache";
import { authedAction, UserError } from "@/lib/action";
import { TAGS } from "@/lib/cache-tags";
import { N8nError } from "@/lib/n8n";
import { capture, captureInput } from "./capture";

export const captureText = authedAction("captureText", captureInput, async (input) => {
  try {
    const result = await capture(input);
    updateTag(TAGS.tasks);
    return result;
  } catch (err) {
    if (err instanceof N8nError) {
      throw new UserError(err.status === 504 ? "Capture took too long. Check Notion in a moment." : "Not saved. Please try again.");
    }
    throw err;
  }
});
