export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="bg-dq-surface rounded-xl border border-dq-border p-6">
        <div className="h-8 w-48 bg-dq-border rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-dq-border-subtle rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-dq-surface rounded-xl border border-dq-border p-6">
            <div className="h-10 w-10 bg-dq-border rounded-lg animate-pulse mb-2" />
            <div className="h-6 w-32 bg-dq-border rounded animate-pulse mb-1" />
            <div className="h-4 w-24 bg-dq-border-subtle rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-dq-surface rounded-xl border border-dq-border p-6">
        <div className="h-6 w-40 bg-dq-border rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full bg-dq-bg rounded border border-dq-border animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
