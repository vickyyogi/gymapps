"use client";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center text-center py-8 px-6 animate-fade-in">
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
          {icon}
        </div>
      ) : (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="size-6"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <h2 className="text-subhead text-text-primary">{title}</h2>
      <p className="mt-2 max-w-sm text-body text-text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyStateWithAction({
  title,
  description,
  actionLabel,
  actionHref,
  icon
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon?: React.ReactNode;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={icon}
      action={
        <a href={actionHref} className="btn btn-primary btn-md">
          {actionLabel}
        </a>
      }
    />
  );
}
