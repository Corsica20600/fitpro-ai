import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/src/components/ui/empty-state";
import { StatBadge } from "@/src/components/ui/stat-badge";

type WorkoutHeroProps = {
  workout: {
    programName: string;
    title: string;
    image: string;
    imageAlt: string;
    mainExerciseName: string | null;
    exerciseCount: number;
    targetMuscles: string[];
    estimatedMinutes: number | null;
    difficulty: string | null;
    isInProgress: boolean;
  } | null;
};

function formatDifficulty(value: string | null) {
  if (value === "BEGINNER") return "Débutant";
  if (value === "INTERMEDIATE") return "Intermédiaire";
  if (value === "ADVANCED") return "Avancé";
  return null;
}

export function WorkoutHero({ workout }: WorkoutHeroProps) {
  if (!workout) {
    return (
      <EmptyState
        title="Aucun programme actif"
        description="Choisis ou crée un programme pour afficher ta séance du jour ici."
        action={
          <Link href="/programs" prefetch={false} className="primary-button full-width">
            Voir les plans
          </Link>
        }
        className="dashboard-empty-hero"
      />
    );
  }

  const difficulty = formatDifficulty(workout.difficulty);

  return (
    <section className="group relative min-h-[430px] overflow-hidden rounded-[32px] border border-[rgba(111,162,255,.26)] bg-[var(--fit-surface-solid)] shadow-[var(--fit-shadow-card)]">
      <Image
        src={workout.image}
        alt={workout.imageAlt}
        fill
        priority
        sizes="(max-width: 640px) 100vw, 560px"
        className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,19,.18)_0%,rgba(3,7,19,.45)_38%,rgba(3,7,19,.94)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 grid gap-5 p-5">
        <div className="grid gap-2">
          <p className="m-0 text-[0.72rem] font-black uppercase tracking-[0.22em] text-[var(--fit-accent-cyan)]">
            {workout.isInProgress ? "Séance en cours" : "Séance du jour"}
          </p>
          <p className="m-0 text-sm font-bold text-[var(--fit-text-muted)]">{workout.programName}</p>
          <h2 className="m-0 text-[2.25rem] font-black leading-[0.96] tracking-[-0.07em] text-white">
            {workout.title}
          </h2>
          {workout.mainExerciseName ? (
            <p className="m-0 text-sm font-semibold text-[var(--fit-text-soft)]">
              Focus: {workout.mainExerciseName}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {workout.exerciseCount > 0 ? <StatBadge tone="accent">{workout.exerciseCount} exos</StatBadge> : null}
          {workout.estimatedMinutes ? <StatBadge tone="warning">{workout.estimatedMinutes} min</StatBadge> : null}
          {difficulty ? <StatBadge tone="violet">{difficulty}</StatBadge> : null}
          {workout.targetMuscles.map((muscle) => (
            <StatBadge key={muscle} tone="neutral">{muscle}</StatBadge>
          ))}
        </div>

        <Link
          href="/workout"
          prefetch={false}
          className="inline-flex min-h-[56px] items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#36a2ff,#2768ff)] px-5 text-base font-black text-white shadow-[0_18px_32px_rgba(39,104,255,.38),inset_0_1px_0_rgba(255,255,255,.35)] outline-none transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-[rgba(55,215,255,.24)]"
        >
          Commencer
        </Link>
      </div>
    </section>
  );
}
