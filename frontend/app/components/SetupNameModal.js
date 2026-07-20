"use client";

import { useState } from "react";

export default function SetupNameModal({ user, open, onComplete, onSkip }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) return onSkip();
    setSaving(true);
    localStorage.setItem("display_name", name.trim());
    onComplete(name.trim());
    setSaving(false);
  };

  return (
    <div className="modal-overlay z-[200]" onClick={onSkip}>
      <div
        className="bg-dq-surface border border-dq-border rounded-2xl p-8 sm:p-10 w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold text-dq-text mb-2">
          Comment veux-tu qu&rsquo;on t&rsquo;appelle ?
        </h2>
        <p className="text-sm text-dq-text-secondary mb-6">
          Choisis un nom d&rsquo;affichage pour personnaliser ton expérience.
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Reda"
          autoFocus
          className="w-full px-4 py-3 rounded-lg bg-dq-bg border border-dq-border text-dq-text placeholder-dq-text-muted focus:outline-none focus:border-dq-accent focus:shadow-[0_0_12px_-4px_var(--dq-accent)] transition-all mb-6"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-4 rounded-lg bg-dq-accent text-white font-medium hover:bg-dq-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "..." : "Enregistrer"}
          </button>
          <button
            onClick={onSkip}
            className="py-3 px-4 text-sm text-dq-text-muted hover:text-dq-text transition-colors bg-transparent border-none cursor-pointer"
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  );
}
