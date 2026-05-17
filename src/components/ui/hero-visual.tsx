import type { ReactNode } from "react";
import Image from "next/image";

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
      <Image src={imageSrc} alt={imageAlt} className="hero-visual-media" fill priority />
      <div className="hero-visual-overlay">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}
