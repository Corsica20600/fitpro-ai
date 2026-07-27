import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";
import { isStripeConfigured } from "@/src/lib/stripe";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";
import { deleteAccountAction } from "@/src/server/account-actions";
import { createBillingCheckoutAction, openBillingPortalAction } from "@/src/server/billing-actions";
import { getAccountSettingsData } from "@/src/server/fitness-queries";

export const metadata = privatePageMetadata(
  "Paramètres",
  "Paramètres privés FitAI Pro pour compte, export de données et intégrations.",
);

function getSettingSections(watchPairingEnabled: boolean) {
  return [
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

type SettingsPageProps = {
  searchParams?: Promise<{
    billing?: string | string[];
    billingError?: string | string[];
    deleteError?: string | string[];
  }>;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSubscriptionLabel(status: string) {
  const labels: Record<string, string> = {
    FREE: "Gratuit",
    TRIALING: "Essai actif",
    ACTIVE: "Actif",
    PAST_DUE: "Paiement à régulariser",
    CANCELED: "Annulé",
    INCOMPLETE: "Paiement incomplet",
    INCOMPLETE_EXPIRED: "Paiement expiré",
    UNPAID: "Impayé",
    PAUSED: "En pause",
  };

  return labels[status] ?? "Gratuit";
}

function getBillingErrorMessage(error: string | undefined) {
  if (error === "config") {
    return "Stripe n'est pas encore configuré dans Vercel. Ajoute les variables Stripe avant de lancer un paiement.";
  }
  if (error === "checkout") {
    return "Stripe n'a pas renvoyé de lien Checkout. Vérifie le prix configuré.";
  }
  if (error === "noCustomer") {
    return "Aucun client Stripe n'est encore lié à ce compte. Lance d'abord l'abonnement.";
  }
  return null;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const watchPairingEnabled = Boolean(process.env.FITAI_WATCH_TOKEN?.trim());
  const settingSections = getSettingSections(watchPairingEnabled);
  const [session, accountData, searchParams] = await Promise.all([
    auth().catch(() => null),
    getAccountSettingsData(),
    props.searchParams ?? Promise.resolve({} as {
      billing?: string | string[];
      billingError?: string | string[];
      deleteError?: string | string[];
    }),
  ]);
  const deleteError = getFirstParam(searchParams.deleteError);
  const billing = getFirstParam(searchParams.billing);
  const billingError = getBillingErrorMessage(getFirstParam(searchParams.billingError));
  const email = session?.user?.email ?? accountData.profile.email ?? "Compte Google";
  const name = accountData.profile.displayName || session?.user?.name || "Utilisateur FitAI";
  const connected = Boolean(session?.user?.email);
  const stripeConfigured = isStripeConfigured();
  const subscriptionStatus = accountData.profile.subscriptionStatus;
  const subscriptionActive = subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING";
  const canOpenPortal = Boolean(accountData.profile.stripeCustomerId);
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

      <GlassCard className="settings-billing-card" elevated>
        <div>
          <p className="eyebrow">Abonnement</p>
          <h2>FitAI Pro</h2>
          <p className="muted">
            Paiement sécurisé par Stripe. Ton abonnement est rattaché au même compte Google que ton historique.
          </p>
        </div>
        <span className={`chip ${subscriptionActive ? "success" : "warning"}`}>
          {getSubscriptionLabel(subscriptionStatus)}
        </span>
        {accountData.profile.subscriptionCancelAtPeriodEnd ? (
          <p className="settings-footnote">
            <span>Renouvellement</span>
            <strong>Annulation programmée</strong>
          </p>
        ) : null}
        {accountData.profile.subscriptionCurrentPeriodEnd ? (
          <p className="settings-footnote">
            <span>Accès jusqu&apos;au</span>
            <strong>{formatDate(accountData.profile.subscriptionCurrentPeriodEnd)}</strong>
          </p>
        ) : null}
        {billing === "success" ? (
          <p className="settings-success-message">
            Paiement validé. Le statut peut prendre quelques secondes à se synchroniser via Stripe.
          </p>
        ) : null}
        {billing === "cancelled" ? (
          <p className="settings-danger-error">
            Paiement annulé, aucun abonnement n&apos;a été activé.
          </p>
        ) : null}
        {billingError ? (
          <p className="settings-danger-error">{billingError}</p>
        ) : null}
        {connected ? (
          <div className="settings-billing-actions">
            {!subscriptionActive ? (
              <form action={createBillingCheckoutAction}>
                <button type="submit" className="primary-button full-line" disabled={!stripeConfigured}>
                  Activer l&apos;abonnement
                </button>
              </form>
            ) : null}
            {canOpenPortal ? (
              <form action={openBillingPortalAction}>
                <button type="submit" className="ghost-btn full-line" disabled={!stripeConfigured}>
                  Gérer mon abonnement
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <p className="muted">Connecte-toi avec Google pour activer ou gérer l&apos;abonnement.</p>
        )}
        {!stripeConfigured ? (
          <p className="settings-footnote">
            <span>Configuration</span>
            <strong>Variables Stripe manquantes côté serveur</strong>
          </p>
        ) : null}
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

      {connected ? (
        <GlassCard className="settings-danger-card">
          <div>
            <p className="eyebrow">Zone sensible</p>
            <h2>Supprimer mon compte</h2>
            <p className="muted">
              Suppression définitive du profil, des séances, des séries, des programmes, des mesures et de la
              synchronisation montre liés à {email}. Exporte tes données avant si tu veux garder une copie.
            </p>
          </div>
          {deleteError === "confirmation" ? (
            <p className="settings-danger-error">
              Confirmation incorrecte. Saisis exactement ton e-mail, le mot SUPPRIMER et coche la case.
            </p>
          ) : null}
          {deleteError === "billing" ? (
            <p className="settings-danger-error">
              Impossible d&apos;annuler l&apos;abonnement Stripe pour le moment. Réessaie ou passe par le portail
              d&apos;abonnement avant de supprimer le compte.
            </p>
          ) : null}
          <form action={deleteAccountAction} className="settings-delete-form">
            <label>
              <span>E-mail du compte</span>
              <input className="input" name="confirmEmail" type="email" placeholder={email} autoComplete="off" />
            </label>
            <label>
              <span>Mot de confirmation</span>
              <input className="input" name="confirmText" type="text" placeholder="SUPPRIMER" autoComplete="off" />
            </label>
            <label className="settings-checkbox-row">
              <input name="understood" type="checkbox" />
              <span>Je comprends que cette action est définitive et que mes statistiques seront supprimées.</span>
            </label>
            <button type="submit" className="ghost-btn danger full-line">
              Supprimer définitivement mon compte
            </button>
          </form>
        </GlassCard>
      ) : null}
    </AppShell>
  );
}
