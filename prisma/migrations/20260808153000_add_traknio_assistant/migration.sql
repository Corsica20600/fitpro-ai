-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "routeContext" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantUnansweredQuestion" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT,
    "question" TEXT NOT NULL,
    "routeContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AssistantUnansweredQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantUsageWindow" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantUsageWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeArticle_active_routeContext_idx" ON "KnowledgeArticle"("active", "routeContext");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_active_idx" ON "KnowledgeArticle"("category", "active");

-- CreateIndex
CREATE INDEX "AssistantUnansweredQuestion_resolved_createdAt_idx" ON "AssistantUnansweredQuestion"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantUnansweredQuestion_userProfileId_createdAt_idx" ON "AssistantUnansweredQuestion"("userProfileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantUsageWindow_userProfileId_windowStart_key" ON "AssistantUsageWindow"("userProfileId", "windowStart");

-- Seed an editable first help base. These records remain ordinary KnowledgeArticle rows.
INSERT INTO "KnowledgeArticle" ("id", "title", "category", "content", "keywords", "routeContext", "active", "createdAt", "updatedAt") VALUES
  ('traknio-help-programs', 'Créer et modifier un programme', 'PROGRAMMES', 'Dans Plans, crée un programme puis renseigne son objectif, ton niveau et le nombre de séances par semaine. Ouvre ensuite une séance du programme pour ajouter ou retirer un exercice. Les changements sont enregistrés dans ton programme.', ARRAY['programme', 'plans', 'creer', 'modifier', 'seance', 'ajouter exercice'], '/programs', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traknio-help-workout-start', 'Lancer une séance', 'SEANCES', 'Ouvre l''onglet Séance puis choisis la séance proposée et appuie sur Démarrer. Pendant la séance, Traknio affiche l''exercice et la série en cours. La validation d''une série lance le temps de repos.', ARRAY['lancer', 'demarrer', 'seance', 'entrainement', 'valider serie'], '/workout', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traknio-help-rest-timer', 'Utiliser le chrono de repos', 'SEANCES', 'Après la validation d''une série, le chrono de repos démarre. Les boutons -15 s et +15 s ajustent la durée restante. Le bouton central met le chrono en pause ou le relance.', ARRAY['repos', 'chrono', 'timer', '15 secondes', 'pause', 'plus 15', 'moins 15'], '/workout', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traknio-help-watch', 'Utiliser la montre Wear OS', 'MONTRE', 'Connecte ton compte Google sur le téléphone, puis ouvre Traknio sur la montre. L''appairage est automatique depuis les paramètres et la montre reçoit un accès propre à cet appareil. Pendant une séance, elle suit les séries, le repos et les changements synchronisés.', ARRAY['montre', 'wear os', 'galaxy watch', 'appairage', 'synchronisation'], '/watch', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traknio-help-progress', 'Consulter la progression', 'PROGRESSION', 'Dans Progrès, choisis une période pour consulter le nombre de séances, le volume, les séries et la durée. Les graphiques et records s''appuient sur les séances terminées enregistrées dans ton historique.', ARRAY['progres', 'progression', 'statistiques', 'volume', 'records', 'graphique'], '/progress', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traknio-help-premium', 'Comprendre l''accès Premium', 'ABONNEMENT', 'L''application est accessible avec un abonnement Premium. Sur Android, l''abonnement passe par Google Play. Les réglages permettent de consulter ou gérer ton accès et les connecteurs associés.', ARRAY['premium', 'abonnement', 'paiement', 'google play', 'acces'], '/settings', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('traknio-help-exercises', 'Choisir des exercices', 'EXERCICES', 'Dans Exos, parcours le catalogue et ouvre une fiche pour consulter les informations de l''exercice. Depuis un programme, utilise Ajouter un exercice pour sélectionner un exercice du catalogue pour la séance.', ARRAY['exercices', 'catalogue', 'fiche exercice', 'ajouter exercice'], '/exercises', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AddForeignKey
ALTER TABLE "AssistantUnansweredQuestion" ADD CONSTRAINT "AssistantUnansweredQuestion_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantUsageWindow" ADD CONSTRAINT "AssistantUsageWindow_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
