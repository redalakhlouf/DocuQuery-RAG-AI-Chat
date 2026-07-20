"use client";

export default function LoginError({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="font-display text-2xl font-bold mb-2 text-dq-text">
          Erreur de connexion
        </h2>
        <p className="text-dq-text-secondary mb-6 text-sm">
          {error.message || "Impossible de charger la page de connexion."}
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
