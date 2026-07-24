import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type GlassCardProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  elevated?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function GlassCard<T extends ElementType = "section">({
  as,
  children,
  className = "",
  elevated = false,
  ...props
}: GlassCardProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={`fit-glass-card ${elevated ? "fit-glass-card--elevated" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
