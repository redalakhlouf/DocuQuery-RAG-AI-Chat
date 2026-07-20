"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="font-display text-2xl font-bold mb-2 text-dq-text">
          Une erreur est survenue
        </h2>
        <p className="text-dq-text-secondary mb-6 text-sm">
          {error.message || "Une erreur inattendue s'est produite."}
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
