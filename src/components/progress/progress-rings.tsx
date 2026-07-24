import { ProgressRing } from "@/src/components/ui/progress-ring";

type ProgressRingItem = {
  label: string;
  valueLabel: string;
  detail: string;
  percent: number;
  tone: "blue" | "green" | "gold" | "violet";
  ariaLabel: string;
};

export function ProgressRings({ items }: { items: ProgressRingItem[] }) {
  return (
    <section className="progress-rings-grid" aria-label="Indicateurs de progression">
      {items.slice(0, 4).map((item) => (
        <article key={item.label} className={`progress-ring-card progress-ring-card--${item.tone}`}>
          <ProgressRing
            value={item.percent}
            valueLabel={item.valueLabel}
            label={item.label}
            ariaLabel={item.ariaLabel}
            size={104}
            strokeWidth={9}
          />
          <p>{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
