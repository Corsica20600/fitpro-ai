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
    label: "Séance",
    value: "Guidage téléphone et montre",
  },
  {
    label: "Récupération",
    value: "Sommeil, pas, FC repos",
  },
  {
    label: "Premium",
    value: "Programmes IA maîtrisés",
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
    eyebrow: "Application mobile",
    title: "Ta séance reste fluide.",
    copy: "Repos, séries, charges, remplacements et historique restent alignés pendant l'entraînement.",
    image: "/brand/traknio-login-reference.png",
    alt: "Aperçu mobile Traknio",
    width: 228,
    height: 436,
  },
  {
    eyebrow: "Wear OS",
    title: "La montre garde le tempo.",
    copy: "Validation des séries, fin de séance et synchronisation suivent l'effort sans casser le rythme.",
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
            src="/brand/traknio-logo-site.png"
            alt={`${BRAND.name} - ${BRAND.tagline}`}
            width={769}
            height={168}
            className="landing-hero__brand"
            priority
          />
          <h1 id="landing-title" className="sr-only">{BRAND.name}</h1>
          <p className="landing-hero__lead">
            Programmes, séance guidée, montre Wear OS, récupération et progression dans une seule expérience.
          </p>
          <div className="landing-actions">
            <Link className="primary-button full-line" href="/login">
              Se connecter
            </Link>
            <Link className="ghost-btn full-line settings-export-link" href="/privacy">
              Confidentialité
            </Link>
          </div>
        </div>
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
              <p className="eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </div>
            <div className="landing-showcase-media">
              <Image
                src={item.image}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="landing-showcase-image"
              />
            </div>
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
