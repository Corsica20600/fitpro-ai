"use client";

type PermissionItem = {
  label: string;
  state: string;
  detail: string;
  tone: "success" | "warning" | "neutral";
};

export function WatchPermissionsCard({ items }: { items: PermissionItem[] }) {
  return (
    <section className="watch-permissions-card">
      <p className="eyebrow">Permissions</p>
      <h2>Accès utilisés</h2>
      <div className="watch-permission-list">
        {items.map((item) => (
          <article key={item.label} className={`watch-permission-item watch-permission-item--${item.tone}`}>
            <strong>{item.label}</strong>
            <span>{item.state}</span>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
