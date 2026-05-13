import type { ReactNode } from "react";

export function HeroVisual({
  title,
  eyebrow,
  imageSrc,
  imageAlt,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  imageSrc: string;
  imageAlt: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hero-visual ${className}`.trim()}>
      <img src={imageSrc} alt={imageAlt} className="hero-visual-media" />
      <div className="hero-visual-overlay">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}
