import Image from "next/image";

export function ExerciseDisplay({
  name,
  subtitle,
  animationPath,
  fallbackPath,
}: {
  name: string;
  subtitle: string;
  animationPath?: string | null;
  fallbackPath: string;
}) {
  const src = animationPath || fallbackPath;

  return (
    <section className="exercise-display card">
      <Image src={src} alt={name} className="exercise-hero-media" width={1200} height={720} />
      <p className="eyebrow">Exercice en cours</p>
      <h2 className="exercise-title">{name}</h2>
      <p className="muted">{subtitle}</p>
    </section>
  );
}
