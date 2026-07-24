import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className = "" }: EmptyStateProps) {
  return (
    <section className={`fit-empty-state ${className}`.trim()}>
      {icon ? <div className="fit-empty-state__icon" aria-hidden="true">{icon}</div> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="fit-empty-state__action">{action}</div> : null}
    </section>
  );
}
