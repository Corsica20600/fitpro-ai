import { auth, signIn, signOut } from "@/auth";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PageHeader } from "@/src/components/ui/page-header";

const settingSections = [
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
    description: "Synchronisation de la montre, état de connexion et diagnostic rapide.",
    status: "Actif",
    tone: "violet",
  },
] as const;

export default async function SettingsPage() {
  const session = await auth().catch(() => null);
  const email = session?.user?.email ?? "longin.erwan@gmail.com";
  const name = session?.user?.name ?? "Erwan";
  const connected = Boolean(session?.user?.email);

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
    </AppShell>
  );
}

