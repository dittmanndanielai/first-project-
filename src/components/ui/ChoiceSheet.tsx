"use client";

import { useEffect, useRef } from "react";

export type Choice = { id: string; label: string; detail?: string };

/**
 * Kleine Auswahl als Sheet: iPhone von unten, sonst mittig. Natives <dialog> mit showModal(),
 * dadurch Fokusfalle, Esc und abgedunkelter Hintergrund ohne Bibliothek.
 */
export function ChoiceSheet({
  open,
  title,
  message,
  choices,
  empty = "Nothing to choose from.",
  onChoose,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  choices: Choice[];
  empty?: string;
  onChoose: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // Tipp auf den Hintergrund
      }}
    >
      <div className="sheet-body">
        <h2 id="sheet-title" className="card-title">
          {title}
        </h2>
        {message ? <p className="sheet-msg">{message}</p> : null}
        <div className="sheet-list">
          {choices.map((c) => (
            <button key={c.id} type="button" className="sheet-choice" onClick={() => onChoose(c.id)}>
              <span>{c.label}</span>
              {c.detail ? <span className="sheet-detail">{c.detail}</span> : null}
            </button>
          ))}
          {choices.length === 0 ? <p className="sheet-msg">{empty}</p> : null}
        </div>
        <button type="button" className="btn sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
