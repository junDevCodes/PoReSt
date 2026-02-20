"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  pushToast: (message: string, variant?: ToastVariant) => void;
};

const TOAST_LIFETIME_MS = 3200;

const ToastContext = createContext<ToastContextValue | null>(null);

const toastClassByVariant: Record<ToastVariant, string> = {
  success: "border-emerald-300/80 bg-emerald-50 text-emerald-900",
  error: "border-rose-300/80 bg-rose-50 text-rose-900",
  info: "border-slate-300/80 bg-white text-slate-800",
};

function createToastId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = createToastId();
    setItems((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      removeToast(id);
    }, TOAST_LIFETIME_MS);
  }, [removeToast]);

  const value = useMemo<ToastContextValue>(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg ${toastClassByVariant[item.variant]}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <p>{item.message}</p>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="text-xs font-semibold text-black/45 hover:text-black"
              >
                닫기
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("ToastProvider 내부에서만 useToast를 사용할 수 있습니다.");
  }
  return context;
}
