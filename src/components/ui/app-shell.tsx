import type { ReactNode } from "react";

export function AppShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`app-shell-screen ${className}`.trim()}>{children}</div>;
}
