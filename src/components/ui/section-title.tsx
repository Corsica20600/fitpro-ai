import type { ReactNode } from "react";

type SectionTitleProps = {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionTitle({ eyebrow, title, action, className = "" }: SectionTitleProps) {
  return (
    <div className={`fit-section-title ${className}`.trim()}>
      <div>
        {eyebrow ? <p className="fit-section-title__eyebrow">{eyebrow}</p> : null}
        <h2 className="fit-section-title__heading">{title}</h2>
      </div>
      {action ? <div className="fit-section-title__action">{action}</div> : null}
    </div>
  );
}
