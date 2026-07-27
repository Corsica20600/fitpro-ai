import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/auth";
import { AppShell } from "@/src/components/ui/app-shell";
import { GlassCard } from "@/src/components/ui/glass-card";

function getSafeCallbackUrl(value: string | string[] | undefined) {
  const callbackUrl = Array.isArray(value) ? value[0] : value;

  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }

  return callbackUrl;
}

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte ton compte Google à FitAI Pro pour retrouver ton historique et sécuriser tes entraînements.",
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage(props: LoginPageProps) {
  const session = await auth().catch(() => null);
  const searchParams = await props.searchParams;
  const callbackUrl = getSafeCallbackUrl(searchParams.callbackUrl);

  if (session?.user?.email) {
    redirect(callbackUrl);
  }

  return (
    <AppShell className="login-page">
      <GlassCard className="login-card" elevated>
        <div className="login-card__halo" aria-hidden="true" />
        <p className="eyebrow">Compte sécurisé</p>
        <h1>Connexion FitAI Pro</h1>
        <p className="muted">
          Connecte ton compte Google pour retrouver ton historique, garder tes séances privées et préparer la future
          version abonnement.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button type="submit" className="primary-button full-line">Continuer avec Google</button>
        </form>
        <p className="login-card__note">
          Chaque compte Google garde son propre historique, ses statistiques et ses futures connexions.
        </p>
        <div className="legal-link-row" aria-label="Documents légaux">
          <Link href="/privacy">Confidentialité</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms">Conditions</Link>
          <span aria-hidden="true">·</span>
          <Link href="/data-deletion">Données</Link>
        </div>
      </GlassCard>
    </AppShell>
  );
}
