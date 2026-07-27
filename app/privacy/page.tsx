import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";

const privacySections = [
  {
    title: "Données collectées",
    items: [
      "Compte Google : adresse e-mail et nom affiché pour identifier ton compte.",
      "Données d'entraînement : programmes, séances, séries, charges, répétitions et progression.",
      "Données d'abonnement : identifiants client et abonnement Stripe, statut de paiement et période d'accès.",
      "Données d'intégrations : statut Spotify, Health Connect ou Samsung Health, permissions demandées et date de synchronisation.",
      "Données techniques : synchronisation montre et état des intégrations quand elles sont activées.",
    ],
  },
  {
    title: "Utilisation",
    items: [
      "Retrouver ton historique sur plusieurs appareils.",
      "Calculer tes statistiques, volumes et tendances de progression.",
      "Gérer l'abonnement, les accès premium et les connexions santé, montre et musique choisies par l'utilisateur.",
    ],
  },
  {
    title: "Contrôle",
    items: [
      "Tu peux exporter tes données depuis les paramètres.",
      "Tu peux demander la suppression définitive du compte depuis les paramètres.",
      "Les accès santé ou musique restent optionnels, explicites et révocables depuis les paramètres.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Politique de confidentialité préparatoire de FitAI Pro : données collectées, usage et contrôle utilisateur.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <AppShell className="legal-page">
      <PageHeader
        eyebrow="Base juridique"
        title="Confidentialité"
        description="Document de travail pour la future version commerciale de FitAI Pro. À faire valider avant publication publique."
      />

      <GlassCard className="legal-card" elevated>
        <p className="eyebrow">Dernière mise à jour</p>
        <h2>27 juillet 2026</h2>
        <p className="muted">
          FitAI Pro est une application d&apos;entraînement. Les données personnelles servent uniquement à fournir le
          compte, l&apos;historique, la synchronisation et les fonctionnalités choisies par l&apos;utilisateur.
        </p>
      </GlassCard>

      <section className="legal-grid" aria-label="Politique de confidentialité">
        {privacySections.map((section) => (
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
        <h2>Contact</h2>
        <p className="muted">
          Pour toute question liée aux données, utilise l&apos;adresse de contact qui sera publiée avec la fiche Play Store.
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
