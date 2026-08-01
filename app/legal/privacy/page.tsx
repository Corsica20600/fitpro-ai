import type { Metadata } from "next";
import { BRAND } from "@/src/lib/brand";
import { PublicLegalPage } from "../public-legal-page";

const sections = [
  {
    title: "Données collectées",
    items: [
      "Compte Google : adresse e-mail et nom affiché pour identifier le compte.",
      "Données d'entraînement : programmes, séances, séries, charges, répétitions et progression.",
      "Données d'abonnement : identifiants d'achat, statut d'abonnement et période d'accès.",
      "Données d'intégrations : Spotify, Health Connect ou Samsung Health uniquement quand l'utilisateur les active.",
      "Données techniques : synchronisation téléphone et montre, état de session et dates de synchronisation.",
    ],
  },
  {
    title: "Utilisation",
    items: [
      "Retrouver l'historique sportif sur les appareils connectés au compte.",
      "Calculer les statistiques, volumes, séries, tendances et indicateurs de progression.",
      "Synchroniser les séances entre téléphone et Galaxy Watch.",
      "Afficher l'état du jour à partir des données santé autorisées par l'utilisateur.",
    ],
  },
  {
    title: "Contrôle utilisateur",
    items: [
      "Les accès santé et Spotify sont optionnels et révocables.",
      "L'utilisateur peut exporter ses données depuis l'application.",
      "L'utilisateur peut demander la suppression de son compte et des données associées.",
      "Les données ne sont pas vendues à des tiers.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Confidentialité - Traknio",
  description: `Politique de confidentialité de ${BRAND.name}.`,
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicLegalPage
      eyebrow="Légal"
      title="Confidentialité"
      description={`${BRAND.name} utilise les données nécessaires au suivi sportif, à la synchronisation et aux fonctionnalités choisies par l'utilisateur.`}
      updatedAt="1 août 2026"
      lead="Cette version publique présente le cadre de traitement prévu pour la publication de Traknio."
      sections={sections}
      noteTitle="Contact données"
      note="Pour toute question liée aux données personnelles, contacte Traknio par e-mail."
    />
  );
}
