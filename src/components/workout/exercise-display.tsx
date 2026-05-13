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
      <img src={src} alt={name} className="exercise-hero-media" />
      <p className="eyebrow">Exercice en cours</p>
      <h2 className="exercise-title">{name}</h2>
      <p className="muted">{subtitle}</p>
    </section>
  );
}
