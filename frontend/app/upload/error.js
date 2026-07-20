"use client";

export default function UploadError({ error, reset }) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-dq-surface rounded-xl border border-dq-border p-8 text-center">
        <div className="text-5xl mb-4">📤</div>
        <h2 className="font-display text-2xl font-bold mb-2 text-dq-text">
          Erreur d&apos;upload
        </h2>
        <p className="text-dq-text-secondary mb-6 text-sm">
          {error.message || "Impossible de charger la page d'upload."}
        </p>
        <button
          onClick={reset}
          className="bg-dq-accent hover:bg-dq-accent-hover text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
