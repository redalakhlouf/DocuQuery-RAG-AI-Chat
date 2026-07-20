export default function EmptyState({ icon = "📄", title, description, actionLabel, actionHref }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-5xl mb-4 block select-none" aria-hidden="true">
        {icon}
      </span>
      <p className="text-dq-text font-medium">{title}</p>
      {description && (
        <p className="text-sm text-dq-text-secondary mt-1">{description}</p>
      )}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-4 text-dq-accent hover:text-dq-accent-hover transition-colors text-sm font-medium"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
