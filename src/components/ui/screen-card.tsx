import type { ReactNode } from "react";

export function ScreenCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card">
      <header className="card-header">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
