import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";

const deletionSteps = [
  "Connecte-toi au compte Google utilisé dans FitAI Pro.",
  "Va dans Paramètres puis vérifie que l'historique affiché correspond bien au compte à supprimer.",
  "Contacte le support officiel indiqué sur la fiche Play Store en demandant la suppression du compte FitAI Pro.",
  "Après vérification, le profil, les séances, les programmes et les mesures associées seront supprimés.",
] as const;

const deletedData = [
  "Profil FitAI Pro et adresse e-mail associée",
  "Programmes, séances, séries et historiques d'entraînement",
  "Mesures de progression enregistrées",
  "Préférences liées aux intégrations activées",
] as const;

const retainedData = [
  "Données strictement nécessaires aux obligations légales ou antifraude, si elles existent.",
  "Données déjà anonymisées ne permettant plus d'identifier le compte.",
] as const;

export const metadata: Metadata = {
  title: "Suppression des données",
  description: "Procédure publique pour demander la suppression d'un compte FitAI Pro et des données associées.",
  alternates: {
    canonical: "/data-deletion",
  },
};

export default function DataDeletionPage() {
  return (
    <AppShell className="legal-page">
      <PageHeader
        eyebrow="Gestion des données"
        title="Suppression du compte et des données"
        description="Page publique destinée à expliquer comment demander la suppression d'un compte FitAI Pro et des données associées."
      />

      <GlassCard className="legal-card" elevated>
        <p className="eyebrow">Statut</p>
        <h2>Processus manuel pendant la phase privée</h2>
        <p className="muted">
          La suppression automatique sera ajoutée avant une ouverture commerciale complète. Pour l&apos;instant, cette
          page formalise le parcours de demande et le périmètre des données concernées.
        </p>
      </GlassCard>

      <section className="legal-grid" aria-label="Suppression des données">
        <GlassCard className="legal-card">
          <h2>Comment demander la suppression</h2>
          <ol className="legal-list">
            {deletionSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard className="legal-card">
          <h2>Données supprimées</h2>
          <ul className="legal-list">
            {deletedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="legal-card">
          <h2>Données pouvant être conservées</h2>
          <ul className="legal-list">
            {retainedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </GlassCard>
      </section>

      <GlassCard className="legal-card">
        <h2>Avant de supprimer</h2>
        <p className="muted">
          Tu peux exporter une copie de tes données depuis les paramètres avant de demander la suppression.
        </p>
        <div className="legal-link-row">
          <Link href="/settings">Paramètres</Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy">Confidentialité</Link>
        </div>
      </GlassCard>
    </AppShell>
  );
}
