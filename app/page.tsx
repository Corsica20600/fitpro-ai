import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { BRAND } from "@/src/lib/brand";

const highlights = [
  {
    label: "Téléphone",
    value: "Séance guidée en temps réel",
  },
  {
    label: "Montre",
    value: "Wear OS synchronisée",
  },
  {
    label: "Progression",
    value: "Historique et records",
  },
] as const;

const pillars = [
  "Programmes de musculation personnalisés",
  "Repos, séries et charge synchronisés téléphone/montre",
  "État du jour avec récupération, sommeil et activité",
  "Spotify, historique, volume et progression",
] as const;

const showcase = [
  {
    title: "Application mobile",
    copy: "Une séance lisible, rapide à valider, avec les changements de poids, reps et exercices conservés dans l'historique.",
    image: "/brand/traknio-login-reference.png",
    alt: "Aperçu mobile Traknio",
    width: 228,
    height: 436,
  },
  {
    title: "Montre connectée",
    copy: "La montre garde le rythme pendant l'effort : validation des séries, repos et synchronisation sans friction.",
    image: "/brand/traknio-watch-reference.png",
    alt: "Aperçu montre Traknio",
    width: 260,
    height: 274,
  },
] as const;

export const metadata: Metadata = {
  title: "Train smarter. Progress further.",
  description: "Traknio accompagne tes entraînements avec programmes, suivi en séance, récupération et synchronisation Wear OS.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const session = await auth().catch(() => null);

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <AppShell className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__content">
          <Image
            src="/brand/traknio-logo-mark-exact.png"
            alt=""
            width={167}
            height={94}
            className="landing-hero__mark"
            priority
          />
          <h1 id="landing-title">{BRAND.name}</h1>
          <p>{BRAND.tagline}</p>
          <div className="landing-actions">
            <Link className="primary-button full-line" href="/login">
              Se connecter
            </Link>
            <Link className="ghost-btn full-line settings-export-link" href="/privacy">
              Confidentialité
            </Link>
          </div>
        </div>
        <Image
          src="/brand/traknio-launch-reference.png"
          alt="Aperçu de lancement Traknio"
          width={414}
          height={626}
          className="landing-hero__visual"
          priority
        />
      </section>

      <section className="landing-stats" aria-label="Points forts">
        {highlights.map((item) => (
          <GlassCard key={item.label} className="landing-stat-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </GlassCard>
        ))}
      </section>

      <section className="landing-showcase" aria-label="Aperçus Traknio">
        {showcase.map((item) => (
          <article key={item.title} className="landing-showcase-item">
            <div className="landing-showcase-copy">
              <p className="eyebrow">{item.title}</p>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </div>
            <Image
              src={item.image}
              alt={item.alt}
              width={item.width}
              height={item.height}
              className="landing-showcase-image"
            />
          </article>
        ))}
      </section>

      <GlassCard className="landing-pillars-card">
        <p className="eyebrow">Pré-lancement</p>
        <h2>L&apos;identité est posée, les domaines arrivent.</h2>
        <ul className="legal-list">
          {pillars.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </GlassCard>

      <div className="legal-link-row">
        <Link href="/terms">Conditions</Link>
        <span aria-hidden="true">·</span>
        <Link href="/data-deletion">Suppression des données</Link>
        <span aria-hidden="true">·</span>
        <Link href="/login">Connexion Google</Link>
      </div>
    </AppShell>
  );
}
