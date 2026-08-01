import type { Metadata } from "next";
import { BRAND } from "@/src/lib/brand";
import { PublicLegalPage } from "../public-legal-page";

const sections = [
  {
    title: "Usage de l'application",
    items: [
      `${BRAND.name} aide à organiser les entraînements, suivre les performances et synchroniser une montre Wear OS.`,
      "L'utilisateur reste responsable de l'exécution des exercices, du choix des charges et de l'adaptation à son niveau.",
      "Les contenus proposés ne remplacent pas un avis médical ou l'accompagnement d'un professionnel.",
    ],
  },
  {
    title: "Compte et abonnement",
    items: [
      "La connexion Google rattache les données au bon compte utilisateur.",
      "Les abonnements donnent accès aux fonctionnalités premium indiquées dans l'application.",
      "La gestion et la résiliation de l'abonnement se font depuis la plateforme utilisée lors de l'achat.",
    ],
  },
  {
    title: "Services connectés",
    items: [
      "Spotify, Health Connect et Samsung Health sont optionnels.",
      "La disponibilité de ces services dépend des autorisations accordées et des plateformes tierces.",
      "Traknio peut évoluer pour améliorer les fonctionnalités, la sécurité et la stabilité du service.",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Conditions d'utilisation - Traknio",
  description: `Conditions d'utilisation de ${BRAND.name}.`,
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <PublicLegalPage
      eyebrow="Légal"
      title="Conditions d'utilisation"
      description={`Ces conditions encadrent l'utilisation de ${BRAND.name}, de ses fonctionnalités sportives et de ses intégrations.`}
      updatedAt="1 août 2026"
      lead="Le service est conçu pour accompagner l'entraînement, pas pour remplacer un suivi médical."
      sections={sections}
      noteTitle="Besoin d'aide ?"
      note="Pour une question sur l'utilisation de Traknio ou l'abonnement, contacte le support."
    />
  );
}
