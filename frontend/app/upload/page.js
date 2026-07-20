"use client";

import { useUser } from "@/app/hooks/useUser";
import { useDocumentStatus } from "@/app/hooks/useDocumentStatus";
import DropZone from "@/app/components/DropZone";
import Badge from "@/app/components/Badge";
import Skeleton from "@/app/components/Skeleton";
import { useError } from "@/app/contexts/ErrorContext";
import { getToken } from "@/app/utils/api";
import { useCallback, useState, useEffect } from "react";
import { setGridSpeed, boostGrid } from "@/app/components/GridBackground";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadPage() {
  const { user, loading } = useUser("/login");
  const { status, filename, polling, startPolling } = useDocumentStatus();
  const { addToast } = useError();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedDocId, setUploadedDocId] = useState(null);

  // Grid speed follows upload progress
  useEffect(() => {
    if (!uploading) {
      setGridSpeed(1);
      return;
    }
    const speed = 1 - (progress / 100) * 0.7;
    setGridSpeed(Math.max(0.3, speed));
  }, [progress, uploading]);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setMessage(null);
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setMessage(null);
    setError(null);
    setUploadedDocId(null);

    const token = await getToken();
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const xhr = new XMLHttpRequest();

      const result = await new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              reject(
                new Error(JSON.parse(xhr.responseText).detail || "Erreur")
              );
            } catch {
              reject(new Error(`Erreur ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("Erreur réseau"))
        );
        xhr.addEventListener("abort", () =>
          reject(new Error("Upload annulé"))
        );

        xhr.open("POST", `${API_BASE}/api/v1/documents/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      setMessage(`Document "${result.filename}" uploadé avec succès !`);
      addToast(`Document "${result.filename}" uploadé !`, "success");
      setUploadedDocId(result.document_id);
      setSelectedFile(null);
      setProgress(100);
      boostGrid(0.5, 1000);
      startPolling(result.document_id);
    } catch (err) {
      const msg =
        err.message ||
        "Erreur lors de l'upload. Vérifie que le backend est lancé.";
      setError(msg);
      addToast(msg, "error");
    }

    setUploading(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-20">
        <div className="bg-dq-surface rounded-xl border border-dq-border p-4 sm:p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-20">
      <div className="bg-dq-surface rounded-xl border border-dq-border p-4 sm:p-6">
        <h1 className="font-display text-2xl font-semibold mb-6 text-dq-text">
          Uploader un document
        </h1>

        <DropZone onFileSelect={handleFileSelect} disabled={uploading} />

        {selectedFile && !uploading && (
          <div className="mt-4 p-3 rounded bg-dq-bg border border-dq-border flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span>📄</span>
              <span className="text-sm font-medium truncate text-dq-text">
                {selectedFile.name}
              </span>
              <span className="text-xs text-dq-text-muted font-mono">
                ({(selectedFile.size / 1024).toFixed(1)} Ko)
              </span>
            </div>
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-dq-accent text-dq-text text-sm rounded-lg hover:bg-dq-accent-hover transition-colors flex-shrink-0"
            >
              Uploader
            </button>
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-dq-bg rounded-full h-2 border border-dq-border">
              <div
                className="bg-dq-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-dq-text-muted mt-1 text-right font-mono">
              {progress}%
            </p>
          </div>
        )}

        {message && (
          <p className="mt-4 p-3 rounded bg-dq-success/10 text-dq-success border border-dq-success/20 text-sm">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 p-3 rounded bg-dq-error/10 text-dq-error border border-dq-error/20 text-sm">
            {error}
          </p>
        )}

        {uploadedDocId && status && (
          <div className="mt-4 p-4 rounded bg-dq-bg border border-dq-border">
            <p className="text-sm font-medium mb-2 text-dq-text">
              Traitement du document
            </p>
            <div className="flex items-center gap-3">
              <span className="text-lg">📄</span>
              <span className="text-sm text-dq-text truncate">{filename}</span>
              <Badge status={status} pulse={polling && status === "processing"} />
            </div>
          </div>
        )}

        {uploadedDocId && (
          <div className="mt-4 flex gap-4">
            <a
              href="/dashboard"
              className="text-sm text-dq-accent hover:text-dq-accent-hover transition-colors"
            >
              ← Retour au tableau de bord
            </a>
            {status === "ready" && (
              <a
                href="/chat"
                className="text-sm text-dq-accent hover:text-dq-accent-hover transition-colors"
              >
                Discuter de ce document →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
