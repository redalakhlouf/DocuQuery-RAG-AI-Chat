"use client";

import { apiGet } from "@/app/utils/api";
import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL = 2000; // 2 secondes
const TERMINAL_STATUSES = ["ready", "error"];

export function useDocumentStatus(documentId) {
  const [status, setStatus] = useState(null);
  const [filename, setFilename] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef(null);

  const startPolling = (docId) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setPolling(true);

    const check = async () => {
      try {
        const data = await apiGet(`/api/v1/documents/${docId}/status`);
        setStatus(data.status);
        setFilename(data.filename);
        setCreatedAt(data.created_at);

        if (TERMINAL_STATUSES.includes(data.status)) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPolling(false);
        }
      } catch {
        // Silently retry on next interval
      }
    };

    check(); // Premier appel immédiat
    intervalRef.current = setInterval(check, POLL_INTERVAL);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { status, filename, createdAt, polling, startPolling };
}
