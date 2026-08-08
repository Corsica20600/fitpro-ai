import type { AssistantArticleProposal } from "./admin-proposals";

export type ProposalProgressArticle = {
  id: string;
  title: string;
  category: string;
  routeContext: string | null;
};

export type ExistingProposalProgress = {
  proposalId: string;
  articleId: string | null;
};

function comparableValue(value: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr-FR");
}

/**
 * Links only legacy articles that are an exact semantic match for a proposal.
 * New articles already persist their source proposal when they are created.
 */
export function findLegacyProposalProgress(
  proposals: AssistantArticleProposal[],
  articles: ProposalProgressArticle[],
  progress: ExistingProposalProgress[],
) {
  const linkedProposalIds = new Set(progress.map((entry) => entry.proposalId));
  const linkedArticleIds = new Set(progress.flatMap((entry) => entry.articleId ? [entry.articleId] : []));

  return proposals.flatMap((proposal) => {
    if (linkedProposalIds.has(proposal.id)) return [];

    const article = articles.find((candidate) => (
      !linkedArticleIds.has(candidate.id)
      && comparableValue(candidate.title) === comparableValue(proposal.title)
      && comparableValue(candidate.category) === comparableValue(proposal.category)
      && comparableValue(candidate.routeContext) === comparableValue(proposal.routeContext)
    ));

    if (!article) return [];
    linkedArticleIds.add(article.id);
    return [{ proposalId: proposal.id, articleId: article.id }];
  });
}
