export default function Badge({ status, pulse = false }) {
  const colorMap = {
    ready: "bg-dq-success/10 text-dq-success border-dq-success/20",
    error: "bg-dq-error/10 text-dq-error border-dq-error/20",
    processing: "bg-dq-accent/10 text-dq-accent border-dq-accent/20",
    pending: "bg-dq-accent/10 text-dq-accent border-dq-accent/20",
  };

  const color =
    colorMap[status] ||
    "bg-dq-text-muted/10 text-dq-text-muted border-dq-text-muted/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium font-mono ${color}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75 motion-safe:animate-ping motion-reduced:animate-none" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {status}
    </span>
  );
}
