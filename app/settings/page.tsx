import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";
import { getAccountSettingsData } from "@/src/server/fitness-queries";

export const metadata = privatePageMetadata(
  "Paramètres",
  "Paramètres privés FitAI Pro pour compte, export de données et intégrations.",
);

function getSettingSections(watchPairingEnabled: boolean) {
  return [
  {
    eyebrow: "Abonnement",
    title: "FitAI Pro",
    description: "Préparation du futur abonnement Play Store, avec statut et gestion de formule.",
    status: "À venir",
    tone: "warning",
  },
  {
    eyebrow: "Santé",
    title: "Health Connect",
    description: "Point d'entrée propre pour Samsung Health, Google Fit/Fitbit et les données santé.",
    status: "Bientôt",
    tone: "success",
  },
  {
    eyebrow: "Musique",
    title: "Spotify",
    description: "Connexion musique pour lancer les playlists d'entraînement depuis la séance.",
    status: "Bientôt",
    tone: "accent",
  },
  {
    eyebrow: "Montre",
    title: "Wear OS",
    description: watchPairingEnabled
      ? "Synchronisation montre protégée par token côté API."
      : "Synchronisation montre en compatibilité temporaire, ajoute FITAI_WATCH_TOKEN dans Vercel.",
    status: watchPairingEnabled ? "Sécurisé" : "Compatibilité",
    tone: "violet",
  },
  ] as const;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "Aucune séance";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function SettingsPage() {
  const watchPairingEnabled = Boolean(process.env.FITAI_WATCH_TOKEN?.trim());
  const settingSections = getSettingSections(watchPairingEnabled);
  const [session, accountData] = await Promise.all([
    auth().catch(() => null),
    getAccountSettingsData(),
  ]);
  const email = session?.user?.email ?? accountData.profile.email ?? "longin.erwan@gmail.com";
  const name = accountData.profile.displayName || session?.user?.name || "Erwan";
  const connected = Boolean(session?.user?.email);
  const latestSessionDate = accountData.latestSession?.endedAt
    ?? accountData.latestSession?.startedAt
    ?? accountData.latestSession?.createdAt
    ?? null;

  return (
    <AppShell className="settings-page">
      <PageHeader
        eyebrow="Compte & connexions"
        title="Paramètres"
        description="Gère ton compte, tes futures intégrations et les connexions externes sans encombrer l'écran d'entraînement."
      />

      <GlassCard className="settings-account-card" elevated>
        <div>
          <p className="eyebrow">Compte Google</p>
          <h2>{connected ? name : "Connexion requise"}</h2>
          <p className="muted">{connected ? email : "Connecte ton compte Google pour retrouver ton historique et préparer l'abonnement."}</p>
        </div>
        <span className={`chip ${connected ? "success" : "warning"}`}>
          {connected ? "Connecté" : "Non connecté"}
        </span>
        {connected ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className="ghost-btn full-line">Se déconnecter</button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className="primary-button full-line">Connexion Google</button>
          </form>
        )}
      </GlassCard>

      <GlassCard className="settings-data-card">
        <div>
          <p className="eyebrow">Données FitAI</p>
          <h2>Historique rattaché à {name}</h2>
          <p className="muted">
            Ton historique reste lié au profil Neon associé à ton compte Google. Les prochains modules commerciaux
            partiront de cette base.
          </p>
        </div>
        <div className="settings-stat-grid" aria-label="Résumé des données du compte">
          <div>
            <strong>{accountData.stats.completedSessions}</strong>
            <span>Séances terminées</span>
          </div>
          <div>
            <strong>{accountData.stats.workoutSessions}</strong>
            <span>Séances totales</span>
          </div>
          <div>
            <strong>{accountData.stats.programs}</strong>
            <span>Programmes</span>
          </div>
          <div>
            <strong>{accountData.stats.progressMetrics}</strong>
            <span>Mesures</span>
          </div>
        </div>
        <div className="settings-footnote">
          <span>Dernière activité</span>
          <strong>{formatDate(latestSessionDate)}</strong>
        </div>
        {connected ? (
          <a className="ghost-btn full-line settings-export-link" href="/api/account/export">
            Exporter mes données
          </a>
        ) : null}
      </GlassCard>

      <section className="settings-grid" aria-label="Connexions et services">
        {settingSections.map((section) => (
          <GlassCard key={section.title} className="settings-service-card">
            <div>
              <p className="eyebrow">{section.eyebrow}</p>
              <h2>{section.title}</h2>
              <p className="muted">{section.description}</p>
            </div>
            <span className={`chip ${section.tone}`}>{section.status}</span>
          </GlassCard>
        ))}
      </section>

      <GlassCard className="settings-legal-card">
        <div>
          <p className="eyebrow">Documents</p>
          <h2>Cadre de publication</h2>
          <p className="muted">
            Base de confidentialité et conditions pour préparer une future publication Play Store.
          </p>
        </div>
        <div className="legal-link-row">
          <Link href="/privacy">Confidentialité</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms">Conditions</Link>
          <span aria-hidden="true">·</span>
          <Link href="/data-deletion">Suppression</Link>
        </div>
      </GlassCard>
    </AppShell>
  );
}
