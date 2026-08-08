"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { GlassCard } from "@/src/components/ui/glass-card";
import { PrimaryButton } from "@/src/components/ui/primary-button";
import { StatBadge } from "@/src/components/ui/stat-badge";
import type { AssistantArticleProposal } from "@/src/server/assistant/admin-proposals";
import type { AssistantAdminArticle } from "@/src/server/assistant/admin-service";

type UnansweredQuestion = {
  id: string;
  question: string;
  routeContext: string | null;
  createdAt: string;
  resolved: boolean;
};

type EditorState = {
  id: string | null;
  title: string;
  category: string;
  routeContext: string;
  keywords: string[];
  content: string;
  active: boolean;
  resolvedQuestionId: string | null;
  markQuestionResolved: boolean;
};

type AdminSection = "articles" | "questions" | "proposals";

const ROUTE_OPTIONS = [
  { value: "", label: "Toutes les rubriques" },
  { value: "/dashboard", label: "Tableau de bord" },
  { value: "/exercises", label: "Exercices" },
  { value: "/programs", label: "Plans" },
  { value: "/workout", label: "Séance" },
  { value: "/progress", label: "Progrès" },
  { value: "/history", label: "Historique" },
  { value: "/evolution", label: "Mon évolution" },
  { value: "/watch", label: "Montre" },
  { value: "/settings", label: "Réglages" },
];

function emptyEditor(): EditorState {
  return { id: null, title: "", category: "", routeContext: "", keywords: [], content: "", active: true, resolvedQuestionId: null, markQuestionResolved: false };
}

function editorFromArticle(article: AssistantAdminArticle): EditorState {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    routeContext: article.routeContext ?? "",
    keywords: article.keywords,
    content: article.content,
    active: article.active,
    resolvedQuestionId: null,
    markQuestionResolved: false,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function routeLabel(route: string | null) {
  return ROUTE_OPTIONS.find((option) => option.value === route)?.label ?? "Toutes les rubriques";
}

function questionTitle(question: string) {
  const compact = question.replace(/\s+/g, " ").trim();
  return `Aide : ${compact.length > 130 ? `${compact.slice(0, 127)}...` : compact}`;
}

export function AssistantAdminClient({
  initialArticles,
  initialCategories,
  initialProposals,
  initialQuestions,
}: {
  initialArticles: AssistantAdminArticle[];
  initialCategories: string[];
  initialProposals: AssistantArticleProposal[];
  initialQuestions: UnansweredQuestion[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [categories, setCategories] = useState(initialCategories);
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedId, setSelectedId] = useState<string | null>(initialArticles[0]?.id ?? null);
  const [editor, setEditor] = useState<EditorState>(() => initialArticles[0] ? editorFromArticle(initialArticles[0]) : emptyEditor());
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"updatedAt" | "title" | "category">("updatedAt");
  const [questionFilter, setQuestionFilter] = useState<"open" | "resolved" | "all">("open");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("articles");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const selectedArticle = useMemo(() => articles.find((article) => article.id === selectedId) ?? null, [articles, selectedId]);

  async function refreshArticles() {
    setIsRefreshing(true);
    const params = new URLSearchParams({ status: statusFilter, sort });
    if (query.trim()) params.set("query", query.trim());
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    try {
      const response = await fetch(`/api/admin/assistant/articles?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { articles?: AssistantAdminArticle[]; categories?: string[] } | null;
      if (!response.ok || !payload?.articles || !payload.categories) throw new Error("articles_fetch_failed");
      setArticles(payload.articles);
      setCategories(payload.categories);
      if (selectedId && !payload.articles.some((article) => article.id === selectedId)) {
        setSelectedId(null);
      }
    } catch {
      setNotice({ tone: "error", text: "Les articles n’ont pas pu être actualisés." });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function refreshQuestions(filter = questionFilter) {
    try {
      const response = await fetch(`/api/admin/assistant/unanswered?status=${filter}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { questions?: UnansweredQuestion[] } | null;
      if (!response.ok || !payload?.questions) throw new Error("questions_fetch_failed");
      setQuestions(payload.questions);
    } catch {
      setNotice({ tone: "error", text: "Les questions sans réponse n’ont pas pu être actualisées." });
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void refreshArticles(); }, 250);
    return () => window.clearTimeout(timeout);
    // Filters drive the request; refreshArticles intentionally reads their current values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, categoryFilter, statusFilter, sort]);

  function openArticle(article: AssistantAdminArticle) {
    setSelectedId(article.id);
    setEditor(editorFromArticle(article));
    setKeywordDraft("");
    setNotice(null);
  }

  function createNewArticle() {
    setSelectedId(null);
    setEditor(emptyEditor());
    setKeywordDraft("");
    setNotice(null);
  }

  function addKeywords(value: string) {
    const additions = value.split(",").map((item) => item.trim()).filter(Boolean);
    if (additions.length === 0) return;
    setEditor((current) => ({ ...current, keywords: [...new Set([...current.keywords, ...additions])].slice(0, 20) }));
    setKeywordDraft("");
  }

  function handleKeywordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addKeywords(keywordDraft);
    }
  }

  async function saveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    if (keywordDraft.trim()) addKeywords(keywordDraft);

    const payload = {
      title: editor.title,
      category: editor.category,
      routeContext: editor.routeContext || null,
      keywords: [...editor.keywords, ...keywordDraft.split(",").map((item) => item.trim()).filter(Boolean)],
      content: editor.content,
      active: editor.active,
      resolvedQuestionId: editor.markQuestionResolved ? editor.resolvedQuestionId : null,
    };
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await fetch(editor.id ? `/api/admin/assistant/articles/${encodeURIComponent(editor.id)}` : "/api/admin/assistant/articles", {
        method: editor.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null) as { article?: AssistantAdminArticle } | null;
      if (!response.ok || !body?.article) throw new Error("article_save_failed");
      const saved = body.article;
      setSelectedId(saved.id);
      setEditor(editorFromArticle(saved));
      setKeywordDraft("");
      setNotice({ tone: "success", text: editor.id ? "Article mis à jour." : "Article créé et disponible pour l’assistant." });
      await Promise.all([refreshArticles(), editor.markQuestionResolved && editor.resolvedQuestionId ? refreshQuestions() : Promise.resolve()]);
    } catch {
      setNotice({ tone: "error", text: "La sauvegarde a échoué. Vérifie les champs puis réessaie." });
    } finally {
      setIsSaving(false);
    }
  }

  function answerQuestion(question: UnansweredQuestion) {
    setActiveSection("articles");
    setSelectedId(null);
    setEditor({
      ...emptyEditor(),
      title: questionTitle(question.question),
      category: "AIDE À COMPLÉTER",
      routeContext: question.routeContext ?? "",
      keywords: question.question.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 4).slice(0, 6),
      resolvedQuestionId: question.id,
      markQuestionResolved: true,
    });
    setKeywordDraft("");
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyProposal(proposal: AssistantArticleProposal) {
    setActiveSection("articles");
    setSelectedId(null);
    setEditor({ ...emptyEditor(), title: proposal.title, category: proposal.category, routeContext: proposal.routeContext ?? "", keywords: proposal.keywords, content: proposal.content });
    setKeywordDraft("");
    setNotice({ tone: "success", text: "Brouillon chargé. Relis-le puis enregistre seulement s’il est exact." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateQuestion(question: UnansweredQuestion, resolved: boolean) {
    setIsUpdatingQuestion(question.id);
    try {
      const response = await fetch(`/api/admin/assistant/unanswered/${encodeURIComponent(question.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved }),
      });
      if (!response.ok) throw new Error("question_update_failed");
      await refreshQuestions();
    } catch {
      setNotice({ tone: "error", text: "Le statut de la question n’a pas pu être modifié." });
    } finally {
      setIsUpdatingQuestion(null);
    }
  }

  return (
    <div className="assistant-admin-page">
      {notice ? <p className={`assistant-admin-notice assistant-admin-notice--${notice.tone}`} role="status">{notice.text}</p> : null}
      <nav className="assistant-admin-tabs" aria-label="Sections du centre d’aide" role="tablist">
        <button type="button" role="tab" aria-selected={activeSection === "articles"} className={activeSection === "articles" ? "is-active" : ""} onClick={() => setActiveSection("articles")}>Articles <span>{articles.length}</span></button>
        <button type="button" role="tab" aria-selected={activeSection === "questions"} className={activeSection === "questions" ? "is-active" : ""} onClick={() => setActiveSection("questions")}>Questions sans réponse <span>{questions.filter((question) => !question.resolved).length}</span></button>
        <button type="button" role="tab" aria-selected={activeSection === "proposals"} className={activeSection === "proposals" ? "is-active" : ""} onClick={() => setActiveSection("proposals")}>Propositions <span>{initialProposals.length}</span></button>
      </nav>

      {activeSection === "articles" ? <div className="assistant-admin-layout">
        <GlassCard className="assistant-admin-list-card">
          <div className="assistant-admin-section-head">
            <div><p className="fit-section-title__eyebrow">Base de connaissances</p><h2>Articles</h2></div>
            <PrimaryButton type="button" fullWidth={false} className="assistant-admin-new-button" onClick={createNewArticle}>Nouvel article</PrimaryButton>
          </div>
          <div className="assistant-admin-filters">
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un article" aria-label="Rechercher un article" />
            <select className="input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrer par catégorie">
              <option value="all">Toutes catégories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filtrer par statut"><option value="all">Tous statuts</option><option value="active">Actifs</option><option value="inactive">Inactifs</option></select>
            <select className="input" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Trier les articles"><option value="updatedAt">Mise à jour récente</option><option value="title">Titre</option><option value="category">Catégorie</option></select>
          </div>
          <div className="assistant-admin-article-list" aria-busy={isRefreshing}>
            {articles.length === 0 ? <p className="muted">Aucun article ne correspond aux filtres.</p> : articles.map((article) => (
              <button type="button" key={article.id} onClick={() => openArticle(article)} className={`assistant-admin-article ${selectedArticle?.id === article.id ? "is-selected" : ""}`}>
                <span><strong>{article.title}</strong><small>{article.category} · {routeLabel(article.routeContext)}</small><time dateTime={article.updatedAt}>Modifié {formatDate(article.updatedAt)}</time></span>
                <StatBadge tone={article.active ? "success" : "neutral"}>{article.active ? "Actif" : "Inactif"}</StatBadge>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="assistant-admin-editor-card" elevated>
          <div className="assistant-admin-section-head"><div><p className="fit-section-title__eyebrow">{editor.id ? "Modification" : "Nouvel article"}</p><h2>{editor.id ? "Éditer l’article" : "Écrire une réponse"}</h2></div>{editor.id ? <StatBadge tone={editor.active ? "success" : "neutral"}>{editor.active ? "Publié" : "Désactivé"}</StatBadge> : null}</div>
          <form className="assistant-admin-form" onSubmit={saveArticle}>
            <label><span className="field-label">Titre</span><input className="input" value={editor.title} onChange={(event) => setEditor((state) => ({ ...state, title: event.target.value }))} maxLength={160} required /></label>
            <div className="form-grid"><label><span className="field-label">Catégorie</span><input className="input" list="assistant-admin-categories" value={editor.category} onChange={(event) => setEditor((state) => ({ ...state, category: event.target.value }))} maxLength={80} required /><datalist id="assistant-admin-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist></label><label><span className="field-label">Route concernée</span><select className="input" value={editor.routeContext} onChange={(event) => setEditor((state) => ({ ...state, routeContext: event.target.value }))}>{ROUTE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>
            <label><span className="field-label">Mots-clés</span><input className="input" value={keywordDraft} onChange={(event) => setKeywordDraft(event.target.value)} onKeyDown={handleKeywordKeyDown} onBlur={() => addKeywords(keywordDraft)} placeholder="Écris un mot puis Entrée ou une virgule" /></label>
            {editor.keywords.length > 0 ? <div className="assistant-admin-keywords">{editor.keywords.map((keyword) => <button type="button" key={keyword} onClick={() => setEditor((state) => ({ ...state, keywords: state.keywords.filter((item) => item !== keyword) }))}>{keyword}<span aria-hidden="true">×</span></button>)}</div> : null}
            <label><span className="field-label">Contenu / réponse</span><textarea className="input assistant-admin-textarea" value={editor.content} onChange={(event) => setEditor((state) => ({ ...state, content: event.target.value }))} maxLength={6000} required /></label>
            <label className="assistant-admin-checkbox"><input type="checkbox" checked={editor.active} onChange={(event) => setEditor((state) => ({ ...state, active: event.target.checked }))} /><span><b>Article actif</b><small>Les articles inactifs restent modifiables mais ne sont pas proposés au chat.</small></span></label>
            {editor.resolvedQuestionId ? <label className="assistant-admin-checkbox"><input type="checkbox" checked={editor.markQuestionResolved} onChange={(event) => setEditor((state) => ({ ...state, markQuestionResolved: event.target.checked }))} /><span><b>Marquer la question source comme traitée</b><small>La question sera conservée dans l’historique.</small></span></label> : null}
            <PrimaryButton type="submit" disabled={isSaving}>{isSaving ? "Enregistrement..." : editor.id ? "Enregistrer les modifications" : "Créer l’article"}</PrimaryButton>
          </form>
        </GlassCard>
      </div> : null}

      {activeSection === "questions" ? <GlassCard className="assistant-admin-questions-card">
        <div className="assistant-admin-section-head"><div><p className="fit-section-title__eyebrow">Amélioration progressive</p><h2>Questions sans réponse</h2></div><select className="input assistant-admin-question-filter" value={questionFilter} onChange={(event) => { const nextFilter = event.target.value as typeof questionFilter; setQuestionFilter(nextFilter); void refreshQuestions(nextFilter); }} aria-label="Filtrer les questions"><option value="open">Non traitées</option><option value="resolved">Traitées</option><option value="all">Toutes</option></select></div>
        {questions.length === 0 ? <p className="muted">Aucune question dans cet état. Les nouvelles demandes non couvertes apparaîtront ici.</p> : <div className="assistant-admin-question-list">{questions.map((question) => <article key={question.id}><div><p>{question.question}</p><small>{routeLabel(question.routeContext)} · {formatDate(question.createdAt)}</small></div><div className="assistant-admin-question-actions"><StatBadge tone={question.resolved ? "success" : "warning"}>{question.resolved ? "Traitée" : "À traiter"}</StatBadge>{!question.resolved ? <button type="button" className="ghost-btn" onClick={() => answerQuestion(question)}>Créer une réponse</button> : null}<button type="button" className="ghost-btn" disabled={isUpdatingQuestion === question.id} onClick={() => void updateQuestion(question, !question.resolved)}>{question.resolved ? "Rouvrir" : "Marquer traitée"}</button></div></article>)}</div>}
      </GlassCard> : null}

      {activeSection === "proposals" ? <GlassCard className="assistant-admin-proposals-card">
        <div className="assistant-admin-section-head"><div><p className="fit-section-title__eyebrow">Brouillons à vérifier</p><h2>Propositions de première base</h2><p className="muted">{initialProposals.length} propositions issues des fonctions connues de Traknio. Elles ne sont jamais enregistrées automatiquement.</p></div></div>
        <div className="assistant-admin-proposal-list">{initialProposals.map((proposal) => <article key={proposal.id}><div><strong>{proposal.title}</strong><small>{proposal.category} · {routeLabel(proposal.routeContext)}</small><p>{proposal.content}</p></div><button type="button" className="ghost-btn" onClick={() => applyProposal(proposal)}>Utiliser comme brouillon</button></article>)}</div>
      </GlassCard> : null}
    </div>
  );
}
