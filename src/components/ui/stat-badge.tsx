import type { ReactNode } from "react";

type StatBadgeProps = {
  children: ReactNode;
  tone?: "accent" | "success" | "warning" | "danger" | "violet" | "orange" | "neutral";
  icon?: ReactNode;
  className?: string;
};

export function StatBadge({ children, tone = "neutral", icon, className = "" }: StatBadgeProps) {
  return (
    <span className={`fit-stat-badge fit-stat-badge--${tone} ${className}`.trim()}>
      {icon ? <span className="fit-stat-badge__icon" aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
