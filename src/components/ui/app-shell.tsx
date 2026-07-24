import type { ReactNode } from "react";

export function AppShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`app-shell-screen fit-page-stack ${className}`.trim()}>{children}</div>;
}
