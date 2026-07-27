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
      "Données techniques : synchronisation montre et état des intégrations quand elles sont activées.",
    ],
  },
  {
    title: "Utilisation",
    items: [
      "Retrouver ton historique sur plusieurs appareils.",
      "Calculer tes statistiques, volumes et tendances de progression.",
      "Préparer les futures connexions santé, montre, musique et abonnement.",
    ],
  },
  {
    title: "Contrôle",
    items: [
      "Tu peux exporter tes données depuis les paramètres.",
      "La suppression de compte sera ajoutée avant une ouverture publique.",
      "Les accès santé ou musique resteront optionnels et explicites.",
    ],
  },
] as const;

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
        <Link className="ghost-btn full-line settings-export-link" href="/settings">
          Retour aux paramètres
        </Link>
      </GlassCard>
    </AppShell>
  );
}
