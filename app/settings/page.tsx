import { auth, signIn, signOut } from "@/auth";
import Link from "next/link";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";
import { BRAND } from "@/src/lib/brand";
import { isStripeConfigured } from "@/src/lib/stripe";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";
import { deleteAccountAction } from "@/src/server/account-actions";
import { createBillingCheckoutAction, openBillingPortalAction } from "@/src/server/billing-actions";
import { getAccountSettingsData } from "@/src/server/fitness-queries";
import { disconnectIntegrationAction, enableHealthConnectPreparationAction } from "@/src/server/integration-actions";
import { createWatchDeviceTokenAction, revokeWatchDeviceAction } from "@/src/server/watch-pairing-actions";
import { isSpotifyConfigured } from "@/src/server/spotify";

export const metadata = privatePageMetadata(
  "Paramètres",
  `Paramètres privés ${BRAND.name} pour compte, export de données et intégrations.`,
);

function getSettingSections(watchPairingEnabled: boolean) {
  return [
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
    timeZone: "Europe/Paris",
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
    integration?: string | string[];
    integrationError?: string | string[];
    watch?: string | string[];
    watchError?: string | string[];
    watchLabel?: string | string[];
    watchToken?: string | string[];
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

function getIntegrationMessage(value: string | undefined) {
  if (value === "spotify-connected") return "Spotify est connecté à ton compte.";
  if (value === "health-ready") return "Health Connect est préparé pour l'app Android.";
  if (value === "disconnected") return "Connexion désactivée.";
  return null;
}

function getIntegrationErrorMessage(value: string | undefined) {
  if (value === "spotify-config") return "Spotify n'est pas encore configuré côté Vercel.";
  if (value === "spotify-denied") return "Connexion Spotify annulée.";
  if (value === "spotify-state") return "Connexion Spotify expirée, relance la connexion.";
  if (value === "spotify-client") return "Client secret Spotify incorrect ou Client ID/Secret inversés dans Vercel.";
  if (value === "spotify-redirect") return "Redirect URI Spotify non identique entre Vercel et le dashboard Spotify.";
  if (value === "spotify-token") return "Spotify refuse l'échange du token. Vérifie les identifiants et relance la connexion.";
  if (value === "spotify-profile") return "Spotify est connecté mais le profil utilisateur n'a pas pu être lu.";
  if (value === "spotify-callback") return "Impossible de finaliser Spotify pour le moment.";
  if (value === "provider") return "Intégration inconnue.";
  return null;
}

export default async function SettingsPage(props: SettingsPageProps) {
  const watchPairingEnabled = Boolean(process.env.FITAI_WATCH_TOKEN?.trim());
  const spotifyConfigured = isSpotifyConfigured();
  const settingSections = getSettingSections(watchPairingEnabled);
  const [session, accountData, searchParams] = await Promise.all([
    auth().catch(() => null),
    getAccountSettingsData(),
    props.searchParams ?? Promise.resolve({} as {
      billing?: string | string[];
      billingError?: string | string[];
      deleteError?: string | string[];
      integration?: string | string[];
      integrationError?: string | string[];
      watch?: string | string[];
      watchError?: string | string[];
      watchLabel?: string | string[];
      watchToken?: string | string[];
    }),
  ]);
  const deleteError = getFirstParam(searchParams.deleteError);
  const billing = getFirstParam(searchParams.billing);
  const billingError = getBillingErrorMessage(getFirstParam(searchParams.billingError));
  const integrationMessage = getIntegrationMessage(getFirstParam(searchParams.integration));
  const integrationError = getIntegrationErrorMessage(getFirstParam(searchParams.integrationError));
  const watch = getFirstParam(searchParams.watch);
  const watchError = getFirstParam(searchParams.watchError);
  const watchLabel = getFirstParam(searchParams.watchLabel);
  const watchToken = getFirstParam(searchParams.watchToken);
  const email = session?.user?.email ?? accountData.profile.email ?? "Compte Google";
  const name = accountData.profile.displayName || session?.user?.name || `Utilisateur ${BRAND.name}`;
  const connected = Boolean(session?.user?.email);
  const stripeConfigured = isStripeConfigured();
  const subscriptionStatus = accountData.profile.subscriptionStatus;
  const subscriptionActive = subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING";
  const canOpenPortal = Boolean(accountData.profile.stripeCustomerId);
  const spotify = accountData.integrations.find((item) => item.provider === "SPOTIFY");
  const healthConnect = accountData.integrations.find((item) => item.provider === "HEALTH_CONNECT");
  const samsungHealth = accountData.integrations.find((item) => item.provider === "SAMSUNG_HEALTH");
  const spotifyConnected = spotify?.status === "CONNECTED";
  const healthPrepared = healthConnect?.status === "PENDING" || healthConnect?.status === "CONNECTED";
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
          <h2>{BRAND.name}</h2>
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
          <p className="eyebrow">Données {BRAND.name}</p>
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

      <section className="settings-grid" aria-label="Intégrations connectées">
        {integrationMessage ? (
          <p className="settings-success-message">{integrationMessage}</p>
        ) : null}
        {integrationError ? (
          <p className="settings-danger-error">{integrationError}</p>
        ) : null}
        <GlassCard className="settings-service-card">
          <div>
            <p className="eyebrow">Musique</p>
            <h2>Spotify</h2>
            <p className="muted">
              Connecte Spotify pour préparer les playlists d&apos;entraînement, l&apos;ouverture rapide et les futures
              commandes pendant la séance.
            </p>
            {spotify?.displayName ? (
              <p className="settings-footnote">
                <span>Compte</span>
                <strong>{spotify.displayName}</strong>
              </p>
            ) : null}
          </div>
          <span className={`chip ${spotifyConnected ? "success" : spotifyConfigured ? "accent" : "warning"}`}>
            {spotifyConnected ? "Connecté" : spotifyConfigured ? "Prêt" : "À configurer"}
          </span>
          {spotifyConnected ? (
            <form action={disconnectIntegrationAction}>
              <input type="hidden" name="provider" value="SPOTIFY" />
              <button type="submit" className="ghost-btn full-line">Déconnecter Spotify</button>
            </form>
          ) : (
            <a className={`primary-button full-line ${spotifyConfigured ? "" : "is-disabled"}`.trim()} href={spotifyConfigured ? "/api/integrations/spotify/connect" : "/settings?integrationError=spotify-config"}>
              Connecter Spotify
            </a>
          )}
        </GlassCard>

        <GlassCard className="settings-service-card">
          <div>
            <p className="eyebrow">Santé Android</p>
            <h2>Health Connect</h2>
            <p className="muted">
              Prépare la connexion officielle Android pour lire les séances, pas, fréquence cardiaque et calories après
              consentement explicite dans l&apos;app mobile.
            </p>
          </div>
          <span className={`chip ${healthPrepared ? "success" : "warning"}`}>
            {healthPrepared ? "Préparé" : "À préparer"}
          </span>
          {healthPrepared ? (
            <form action={disconnectIntegrationAction}>
              <input type="hidden" name="provider" value="HEALTH_CONNECT" />
              <button type="submit" className="ghost-btn full-line">Désactiver Health Connect</button>
            </form>
          ) : (
            <form action={enableHealthConnectPreparationAction}>
              <button type="submit" className="ghost-btn full-line">Préparer Health Connect</button>
            </form>
          )}
        </GlassCard>

        <GlassCard className="settings-service-card">
          <div>
            <p className="eyebrow">Samsung</p>
            <h2>Samsung Health</h2>
            <p className="muted">
              Passerelle privée déjà disponible pour tes essais Samsung. Pour le Play Store, Health Connect restera la
              voie la plus universelle.
            </p>
            {samsungHealth?.lastSyncAt ? (
              <p className="settings-footnote">
                <span>Dernière synchro</span>
                <strong>{formatDate(samsungHealth.lastSyncAt)}</strong>
              </p>
            ) : null}
          </div>
          <span className={`chip ${process.env.SAMSUNG_SYNC_TOKEN?.trim() ? "success" : "warning"}`}>
            {process.env.SAMSUNG_SYNC_TOKEN?.trim() ? "Token serveur" : "Non configuré"}
          </span>
        </GlassCard>
      </section>

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

      <GlassCard className="settings-watch-pairing-card">
        <div>
          <p className="eyebrow">Montre Wear OS</p>
          <h2>Pairing avancé</h2>
          <p className="muted">
            Génère un token personnel pour relier une montre au compte {email}. Les anciennes montres peuvent encore
            fonctionner avec le token global, mais ce pairing isole mieux les comptes.
          </p>
        </div>
        {watchToken ? (
          <div className="settings-token-box">
            <span>Token généré pour {watchLabel || "Montre Wear OS"}</span>
            <code>{watchToken}</code>
            <small>Copie-le dans `FITAI_WATCH_DEVICE_TOKEN` puis rebuild l&apos;APK montre. Il ne sera plus affiché ensuite.</small>
          </div>
        ) : null}
        {watch === "revoked" ? (
          <p className="settings-success-message">Montre révoquée. Elle ne pourra plus accéder à ce compte.</p>
        ) : null}
        {watchError === "device" ? (
          <p className="settings-danger-error">Montre introuvable ou déjà révoquée.</p>
        ) : null}
        <form action={createWatchDeviceTokenAction} className="settings-watch-token-form">
          <label>
            <span>Nom de la montre</span>
            <input className="input" name="label" type="text" placeholder="Galaxy Watch Ultra" autoComplete="off" />
          </label>
          <button type="submit" className="ghost-btn full-line">
            Générer un token de montre
          </button>
        </form>
        <div className="settings-watch-device-list">
          {accountData.watchDevices.length > 0 ? (
            accountData.watchDevices.map((device) => (
              <article key={device.id} className="settings-watch-device">
                <div>
                  <strong>{device.label}</strong>
                  <span>
                    Dernière synchro : {device.lastSeenAt ? formatDate(device.lastSeenAt) : "jamais"}
                  </span>
                </div>
                <form action={revokeWatchDeviceAction}>
                  <input type="hidden" name="deviceId" value={device.id} />
                  <button type="submit" className="ghost-btn danger">Révoquer</button>
                </form>
              </article>
            ))
          ) : (
            <p className="muted">Aucune montre personnelle pairée pour le moment.</p>
          )}
        </div>
      </GlassCard>

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
