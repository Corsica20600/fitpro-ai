import { connection } from "next/server";
import { auth } from "@/auth";
import { EvolutionClient } from "@/src/components/evolution/evolution-client";
import { AppShell } from "@/src/components/ui/app-shell";
import { PageHeader } from "@/src/components/ui/page-header";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";
import { getEvolutionOverview } from "@/src/server/body-evolution";
import { requirePremiumAccess } from "@/src/server/premium-access";

export const metadata = privatePageMetadata(
  "Mon évolution",
  "Mensurations et évolution privée Traknio.",
);

export default async function EvolutionPage() {
  await connection();
  const [profile, session] = await Promise.all([
    requirePremiumAccess(),
    auth().catch(() => null),
  ]);
  const overview = await getEvolutionOverview(profile);

  return (
    <AppShell className="evolution-shell">
      <PageHeader
        eyebrow="Suivi physique"
        title="Mon évolution"
        description="Consigne tes mensurations à ton rythme et retrouve une lecture claire de tes progrès."
      />
      <EvolutionClient initialOverview={overview} avatarUrl={session?.user?.image} />
    </AppShell>
  );
}
