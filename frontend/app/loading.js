export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-dq-accent animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-dq-accent animate-pulse [animation-delay:0.2s]" />
          <div className="w-2 h-2 rounded-full bg-dq-accent animate-pulse [animation-delay:0.4s]" />
        </div>
        <p className="text-sm text-dq-text-muted mt-4 font-mono">Chargement...</p>
      </div>
    </div>
  );
}
