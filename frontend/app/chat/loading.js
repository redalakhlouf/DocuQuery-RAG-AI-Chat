export default function ChatLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-20 flex flex-col h-[calc(100vh-80px)]">
      <div className="bg-dq-surface rounded-xl border border-dq-border p-4 mb-4">
        <div className="h-7 w-48 bg-dq-border rounded animate-pulse mb-2" />
        <div className="h-10 w-full bg-dq-bg rounded border border-dq-border animate-pulse" />
      </div>
      <div className="flex-1 bg-dq-surface rounded-xl border border-dq-border p-4 mb-4">
        <div className="h-32 w-full bg-dq-bg rounded-lg border border-dq-border animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-12 flex-1 bg-dq-surface rounded border border-dq-border animate-pulse" />
        <div className="h-12 w-24 bg-dq-accent/50 rounded animate-pulse" />
      </div>
    </div>
  );
}
