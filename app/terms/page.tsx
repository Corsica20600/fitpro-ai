import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";

const termsSections = [
  {
    title: "Usage de l'application",
    items: [
      "FitAI Pro aide à organiser des entraînements, suivre des performances et synchroniser une montre Wear OS.",
      "L'utilisateur reste responsable de l'exécution des exercices et de l'adaptation des charges à son niveau.",
      "Les contenus d'entraînement ne remplacent pas un avis médical ou l'accompagnement d'un professionnel.",
    ],
  },
  {
    title: "Compte et abonnement",
    items: [
      "La connexion Google sert à rattacher les données au bon compte.",
      "Les formules payantes sont gérées par Stripe et affichent le prix, la période et les conditions avant paiement.",
      "La gestion, la résiliation et les moyens de paiement se font depuis le portail d'abonnement accessible dans les paramètres.",
    ],
  },
  {
    title: "Données et disponibilité",
    items: [
      "L'application peut évoluer pendant la phase de préparation commerciale.",
      "Un export des données est disponible depuis les paramètres.",
      "Les intégrations externes comme Spotify, Health Connect ou Samsung Health sont optionnelles et dépendent des services connectés.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions d'utilisation préparatoires de FitAI Pro pour cadrer l'usage de l'application.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <AppShell className="legal-page">
      <PageHeader
        eyebrow="Base juridique"
        title="Conditions d'utilisation"
        description="Version préparatoire pour cadrer l'usage de FitAI Pro avant une publication Play Store."
      />

      <GlassCard className="legal-card" elevated>
        <p className="eyebrow">Dernière mise à jour</p>
        <h2>27 juillet 2026</h2>
        <p className="muted">
          Ces conditions sont une base de travail. Elles devront être relues et adaptées avant une commercialisation.
        </p>
      </GlassCard>

      <section className="legal-grid" aria-label="Conditions d'utilisation">
        {termsSections.map((section) => (
          <GlassCard key={section.title} className="legal-card">
            <h2>{section.title}</h2>
            <ul className="legal-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </section>

      <GlassCard className="legal-card">
        <h2>Important</h2>
        <p className="muted">
          Avant publication publique, il faudra finaliser le nom de l&apos;éditeur, l&apos;adresse de contact, les règles de
          remboursement et les mentions liées aux abonnements.
        </p>
        <div className="legal-link-row">
          <Link href="/data-deletion">Suppression des données</Link>
          <span aria-hidden="true">·</span>
          <Link href="/settings">Paramètres</Link>
        </div>
      </GlassCard>
    </AppShell>
  );
}
