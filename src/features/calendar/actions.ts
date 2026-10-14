"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { authedAction } from "@/lib/action";
import { TAGS } from "@/lib/cache-tags";
import { clearCalendarFailure } from "./store";

/** Manueller Refresh: verwirft den App-Cache, der nächste Aufruf lädt frisch von iCloud. */
export const refreshCalendar = authedAction("refreshCalendar", z.object({}), async () => {
  clearCalendarFailure();
  updateTag(TAGS.calendar);
});
