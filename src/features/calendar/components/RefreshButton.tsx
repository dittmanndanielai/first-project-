"use client";

import { useTransition } from "react";
import { RefreshIcon } from "@/components/ui/icons";
import { useToast } from "@/features/shell/Toast";
import { refreshCalendar } from "../actions";

/** Lädt den Kalender sofort neu von iCloud (verwirft den 5-Minuten-Cache der App). */
export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <button
      type="button"
      className="btn"
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await refreshCalendar({});
          if (!res.ok) toast(res.error);
        })
      }
    >
      {pending ? <span className="spin" /> : <RefreshIcon size={15} />}
      Refresh
    </button>
  );
}
