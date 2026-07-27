import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";

const highlights = [
  {
    label: "Historique",
    value: "Séances sauvegardées",
  },
  {
    label: "Montre",
    value: "Wear OS synchronisé",
  },
  {
    label: "Données",
    value: "Compte Google privé",
  },
] as const;

const pillars = [
  "Programmes et exercices détaillés",
  "Chrono repos synchronisé téléphone/montre",
  "Statistiques, volume et progression",
  "Export des données et base RGPD",
] as const;

export default async function HomePage() {
  const session = await auth().catch(() => null);

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <AppShell className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__orb" aria-hidden="true" />
        <p className="eyebrow">FitAI Pro</p>
        <h1 id="landing-title">Ton cockpit d&apos;entraînement connecté.</h1>
        <p className="muted">
          Une application premium pour piloter tes séances, ton historique et ta montre Wear OS depuis un compte
          sécurisé.
        </p>
        <div className="landing-actions">
          <Link className="primary-button full-line" href="/login">
            Se connecter
          </Link>
          <Link className="ghost-btn full-line settings-export-link" href="/privacy">
            Confidentialité
          </Link>
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

      <GlassCard className="landing-pillars-card">
        <p className="eyebrow">Préparation Play Store</p>
        <h2>Une base sérieuse avant commercialisation</h2>
        <ul className="legal-list">
          {pillars.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </GlassCard>

      <div className="legal-link-row">
        <Link href="/terms">Conditions</Link>
        <span aria-hidden="true">·</span>
        <Link href="/login">Connexion Google</Link>
      </div>
    </AppShell>
  );
}
