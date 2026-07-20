"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setGlobalErrorHandler } from "@/app/utils/api";

const ErrorContext = createContext(null);

let toastId = 0;

export function ErrorProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Wire up the global error handler once
  useEffect(() => {
    setGlobalErrorHandler(addToast);
  }, [addToast]);

  return (
    <ErrorContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useError must be used within ErrorProvider");
  return ctx;
}
