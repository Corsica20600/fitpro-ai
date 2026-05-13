import Link from "next/link";
import { PrimaryButton } from "@/src/components/ui/primary-button";

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero home-hero">
        <p className="eyebrow">FitAI Pro</p>
        <h1>Ton entrainement. Clair. Rapide. Efficace.</h1>
        <p className="muted">Lance ta seance et valide tes series sans friction.</p>
        <Link href="/workout" className="hero-cta-link">
          <PrimaryButton>Demarrer ma seance</PrimaryButton>
        </Link>
      </section>

      <section className="card hero-visual">
        <div className="phone-mock">
          <div className="phone-mock-top">Workout Live</div>
          <div className="phone-mock-main">
            <div className="mock-animation" />
            <p>Developpe couche barre</p>
            <span>Serie 2 / 4 · Repos 01:10</span>
          </div>
        </div>
      </section>
    </div>
  );
}
