export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`rounded bg-dq-border/30 animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}
