import type { ReactNode } from "react";
import { levelToFr } from "@/src/lib/exercise-i18n";

type ProgramCardProps = {
  id: string;
  name: string;
  description: string | null;
  goalLabel: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  statusLabel: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  sessionsCount: number;
  exercisesCount: number;
  muscles: string[];
  equipment: string[];
  actions: ReactNode;
  children: ReactNode;
};

export function ProgramCard({
  id,
  name,
  description,
  goalLabel,
  level,
  statusLabel,
  status,
  sessionsCount,
  exercisesCount,
  muscles,
  equipment,
  actions,
  children,
}: ProgramCardProps) {
  const statusTone = status === "ACTIVE" ? "success" : status === "ARCHIVED" ? "danger" : "warning";

  return (
    <section id={`program-${id}`} className="program-card-v2">
      <div className="program-card-v2__head">
        <div>
          <p className="eyebrow">{goalLabel} · {levelToFr(level)}</p>
          <h2>{name}</h2>
          {description ? <p className="muted">{description}</p> : null}
        </div>
        <span className={`chip ${statusTone}`}>{statusLabel}</span>
      </div>
      <div className="program-card-metrics">
        <span><b>{sessionsCount}</b> séances</span>
        <span><b>{exercisesCount}</b> exercices</span>
        <span><b>{muscles[0] ?? "N/A"}</b> focus</span>
        <span><b>{equipment[0] ?? "Libre"}</b> matériel</span>
      </div>
      {muscles.length > 0 || equipment.length > 0 ? (
        <div className="chips">
          {muscles.slice(0, 4).map((item) => <span key={item} className="chip">{item}</span>)}
          {equipment.slice(0, 3).map((item) => <span key={item} className="chip violet">{item}</span>)}
        </div>
      ) : null}
      <div className="program-card-v2__actions">{actions}</div>
      <div className="program-card-v2__details">{children}</div>
    </section>
  );
}
