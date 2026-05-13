import type { ReactNode } from "react";

export function WorkoutCard({
  children,
  className = "",
  light = false,
}: {
  children: ReactNode;
  className?: string;
  light?: boolean;
}) {
  return <section className={`workout-card ${light ? "light" : ""} ${className}`.trim()}>{children}</section>;
}
