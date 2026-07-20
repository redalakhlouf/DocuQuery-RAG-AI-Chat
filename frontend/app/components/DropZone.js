"use client";

import { useCallback, useRef, useState } from "react";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default function DropZone({ onFileSelect, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragError, setDragError] = useState(null);

  const validateFile = (file) => {
    if (!file) return "Aucun fichier sélectionné.";
    if (file.type !== "application/pdf") {
      return "Seuls les fichiers PDF sont acceptés.";
    }
    if (file.size > MAX_SIZE) {
      return "Le fichier dépasse la taille maximale de 5 Mo.";
    }
    return null;
  };

  const handleFile = (file) => {
    const error = validateFile(file);
    if (error) {
      setDragError(error);
      return;
    }
    setDragError(null);
    onFileSelect(file);
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, onFileSelect, handleFile]);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      aria-label="Zone de dépôt de fichier PDF"
      className={`
        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
        transition-colors duration-200
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${
          dragging
            ? "border-dq-accent bg-dq-accent/5"
            : dragError
            ? "border-dq-error bg-dq-error/5"
            : "border-dq-border hover:border-dq-accent hover:bg-dq-surface"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="text-5xl mb-3 select-none">
        {dragging ? "📥" : dragError ? "⚠️" : "📄"}
      </div>

      {dragError ? (
        <p className="text-sm text-dq-error font-medium">{dragError}</p>
      ) : dragging ? (
        <p className="text-sm text-dq-accent font-medium">
          Dépose le fichier ici...
        </p>
      ) : (
        <>
          <p className="text-sm font-medium text-dq-text">
            Glisse un fichier PDF ici
          </p>
          <p className="text-xs text-dq-text-secondary mt-1">
            ou clique pour parcourir
          </p>
          <p className="text-xs text-dq-text-muted mt-2">
            PDF uniquement — 5 Mo max
          </p>
        </>
      )}
    </div>
  );
}
