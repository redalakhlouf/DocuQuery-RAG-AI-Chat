"use client";

import { useError } from "@/app/contexts/ErrorContext";

const styles = {
  success: "bg-dq-success/10 text-dq-success border-dq-success/20",
  error: "bg-dq-error/10 text-dq-error border-dq-error/20",
  info: "bg-dq-accent/10 text-dq-accent border-dq-accent/20",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useError();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto px-4 py-3 rounded-lg border text-sm animate-slide-up ${styles[t.type] || styles.info}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="bg-transparent border-none cursor-pointer text-current opacity-60 hover:opacity-100 flex-shrink-0 text-lg leading-none"
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
