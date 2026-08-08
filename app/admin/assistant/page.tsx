import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/src/components/ui/app-shell";
import { PageHeader } from "@/src/components/ui/page-header";
import { AssistantAdminClient } from "@/src/components/assistant/assistant-admin-client";
import { isTraknioAdminEmail } from "@/src/server/assistant/admin-access";
import { getAssistantAdminArticles, getAssistantUnansweredQuestions } from "@/src/server/assistant/admin-service";
import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";
import { privatePageMetadata } from "@/src/lib/private-page-metadata";

export const metadata = privatePageMetadata("Administration de l’aide", "Centre privé de connaissances de l’assistant Traknio.");

export default async function AssistantAdministrationPage() {
  await connection();
  const profile = await getAuthenticatedUserProfile().catch(() => null);
  if (!profile) redirect("/login?callbackUrl=/admin/assistant");
  if (!isTraknioAdminEmail(profile.email)) notFound();

  const [articleData, unansweredQuestions] = await Promise.all([
    getAssistantAdminArticles(),
    getAssistantUnansweredQuestions("open"),
  ]);

  return (
    <AppShell className="assistant-admin-shell">
      <PageHeader
        eyebrow="Administration privée"
        title="Centre d’aide Assistant"
        description="Enrichis les réponses de l’assistant sans modifier le code ni son comportement utilisateur."
      />
      <AssistantAdminClient
        initialArticles={articleData.articles}
        initialCategories={articleData.categories}
        initialProposals={articleData.proposals}
        initialQuestions={unansweredQuestions}
      />
    </AppShell>
  );
}
