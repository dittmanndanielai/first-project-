"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastAction = { label: string; onClick: () => void };
type ToastState = { id: number; text: string; action?: ToastAction } | null;
type ShowToast = (text: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback<ShowToast>((text, action) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), text, action });
    // Mit Undo länger sichtbar (wie im Design: 4,5 s statt 2,6 s)
    timer.current = setTimeout(() => setToast(null), action ? 4500 : 2600);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <div className="toast" role="status" key={toast.id}>
          <span>{toast.text}</span>
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                setToast(null);
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
