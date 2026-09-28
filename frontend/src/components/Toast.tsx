"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  push: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ push: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`blueprint-card animate-[float_0.4s_ease] border-l-4 px-4 py-3 text-sm shadow-lg ${
              t.type === "success"
                ? "border-l-[var(--color-ok)]"
                : t.type === "error"
                ? "border-l-[var(--color-danger)]"
                : "border-l-[var(--color-amber)]"
            }`}
            role="status"
          >
            <p className="tech-label mb-0.5">
              {t.type === "success" ? "OK //" : t.type === "error" ? "ERROR //" : "NOTE //"}
            </p>
            <p className="font-sans-tech text-[var(--color-line)]">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
