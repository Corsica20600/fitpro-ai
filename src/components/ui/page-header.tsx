import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`fit-page-header ${className}`.trim()}>
      <div className="fit-page-header__copy">
        {eyebrow ? <p className="fit-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="fit-page-header__title">{title}</h1>
        {description ? <p className="fit-page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="fit-page-header__actions">{actions}</div> : null}
    </header>
  );
}
